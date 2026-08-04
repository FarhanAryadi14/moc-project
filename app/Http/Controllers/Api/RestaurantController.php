<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ArrivePartyRequest;
use App\Http\Requests\ServePartyRequest;
use App\Models\DiningSession;
use App\Models\Party;
use App\Models\RestaurantTable;
use App\Services\DiningService;
use App\Services\QueuePriorityService;
use App\Services\TableAssignmentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class RestaurantController extends Controller
{
    public function __construct(
        protected TableAssignmentService $tableAssignmentService,
        protected QueuePriorityService $queuePriorityService,
        protected DiningService $diningService
    ) {}

    /**
     * POST /api/arrive
     * Party arrives. Auto-seat to best fit table if available, otherwise push to priority queue.
     */
    public function arrive(ArrivePartyRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $party = Party::create([
            'customer_name' => $validated['customer_name'],
            'party_size' => $validated['party_size'],
            'status' => 'waiting',
            'arrived_at' => Carbon::now(),
        ]);

        // Attempt auto-seating to best fit table
        $bestTable = $this->tableAssignmentService->findBestFitTable($party->party_size);
        $session = null;

        if ($bestTable) {
            $session = $this->diningService->seatParty($party, $bestTable);
            $message = "Party {$party->customer_name} ({$party->party_size} orang) langsung ditempatkan di Meja {$bestTable->code}.";
        } else {
            $message = "Party {$party->customer_name} ({$party->party_size} orang) masuk ke dalam antrean prioritas.";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'party' => $party->fresh(),
                'assigned_table' => $bestTable ? $bestTable->code : null,
                'session' => $session ? $session->load('table') : null,
                'status' => $party->status,
            ],
        ], 201);
    }

    /**
     * GET /api/status
     * Returns live status of all tables, active dining sessions, and priority waiting queue.
     */
    public function status(): JsonResponse
    {
        $tables = RestaurantTable::orderBy('code', 'asc')
            ->get()
            ->map(function (RestaurantTable $table) {
                $activeSession = DiningSession::with('party')
                    ->where('restaurant_table_id', $table->id)
                    ->where('status', 'active')
                    ->latest()
                    ->first();

                $sessionData = null;
                $colorStatus = 'hijau'; // available

                if ($activeSession) {
                    $now = Carbon::now();
                    $startedAt = $activeSession->started_at;
                    $estimatedEndAt = $activeSession->estimated_end_at;
                    $totalDurationSec = $startedAt->diffInSeconds($estimatedEndAt);
                    $elapsedSec = $startedAt->diffInSeconds($now, false);
                    $remainingSec = max(0, $now->diffInSeconds($estimatedEndAt, false));

                    // Color rules:
                    // Hijau = Available
                    // Biru = Seated within last 2 minutes
                    // Merah = Ending soon (< 5 mins / overdue)
                    // Kuning = Occupied in middle phase
                    if ($startedAt->diffInMinutes($now) <= 2) {
                        $colorStatus = 'biru'; // Just seated / served
                    } elseif ($remainingSec <= 300) { // <= 5 mins left
                        $colorStatus = 'merah'; // Ending soon
                    } else {
                        $colorStatus = 'kuning'; // Occupied dining
                    }

                    $sessionData = [
                        'id' => $activeSession->id,
                        'party_id' => $activeSession->party_id,
                        'customer_name' => $activeSession->party->customer_name,
                        'party_size' => $activeSession->party->party_size,
                        'started_at' => $startedAt->toIso8601String(),
                        'started_at_timestamp' => $startedAt->timestamp * 1000,
                        'estimated_end_at' => $estimatedEndAt->toIso8601String(),
                        'estimated_end_timestamp' => $estimatedEndAt->timestamp * 1000,
                        'dining_duration_minutes' => $activeSession->dining_duration_minutes,
                        'total_duration_sec' => $totalDurationSec,
                        'remaining_sec' => $remainingSec,
                        'elapsed_sec' => max(0, $elapsedSec),
                    ];
                }

                return [
                    'id' => $table->id,
                    'code' => $table->code,
                    'capacity' => $table->capacity,
                    'status' => $table->status,
                    'color_status' => $colorStatus,
                    'active_session' => $sessionData,
                ];
            });

        $queue = $this->queuePriorityService->getOrderedQueue()->values()->map(function ($party, $index) {
            return [
                'priority_rank' => $index + 1,
                'id' => $party->id,
                'customer_name' => $party->customer_name,
                'party_size' => $party->party_size,
                'status' => $party->status,
                'arrived_at' => $party->arrived_at->toIso8601String(),
                'arrived_at_timestamp' => $party->arrived_at->timestamp * 1000,
                'wait_time_minutes' => round($party->arrived_at->diffInMinutes(Carbon::now())),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'tables' => $tables,
                'queue' => $queue,
                'summary' => [
                    'total_tables' => $tables->count(),
                    'occupied_tables' => $tables->where('status', 'occupied')->count(),
                    'available_tables' => $tables->where('status', 'available')->count(),
                    'waiting_parties' => $queue->count(),
                ],
            ],
        ]);
    }

    /**
     * POST /api/serve
     * Serves next waiting party, seats specific party to table, or force completes an active table session.
     */
    public function serve(ServePartyRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            // Handle Force Complete request on a table
            if (!empty($validated['force_complete_table_id'])) {
                $table = RestaurantTable::findOrFail($validated['force_complete_table_id']);
                $activeSession = DiningSession::where('restaurant_table_id', $table->id)
                    ->where('status', 'active')
                    ->first();

                if (!$activeSession) {
                    return response()->json([
                        'success' => false,
                        'message' => "Meja {$table->code} sedang tidak terisi.",
                    ], 422);
                }

                $result = $this->diningService->completeSession($activeSession, true);

                $message = "Meja {$table->code} berhasil diclear (Force Complete).";
                if ($result['auto_seated_session']) {
                    $autoParty = $result['auto_seated_session']->party;
                    $message .= " Party {$autoParty->customer_name} ({$autoParty->party_size} orang) otomatis dipindahkan dari queue ke Meja {$table->code}.";
                }

                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => $result,
                ]);
            }

            // Handle seating a specific party (e.g. via Drag & Drop or selection)
            if (!empty($validated['party_id'])) {
                $party = Party::findOrFail($validated['party_id']);
                $table = !empty($validated['table_id']) ? RestaurantTable::findOrFail($validated['table_id']) : null;

                $session = $this->diningService->seatParty($party, $table);

                return response()->json([
                    'success' => true,
                    'message' => "Party {$party->customer_name} berhasil didudukkan di Meja {$session->table->code}.",
                    'data' => [
                        'session' => $session->load('table', 'party'),
                    ],
                ]);
            }

            // Default: Auto-serve highest priority party from queue to best fit table
            $availableTables = $this->tableAssignmentService->getAvailableTables();
            if ($availableTables->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada meja kosong yang tersedia saat ini.',
                ], 422);
            }

            $orderedQueue = $this->queuePriorityService->getOrderedQueue();
            if ($orderedQueue->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Antrean pelanggan saat ini kosong.',
                ], 422);
            }

            // Find first waiting party that fits any available table
            $seatedSession = null;
            foreach ($orderedQueue as $party) {
                $bestTable = $this->tableAssignmentService->findBestFitTable($party->party_size);
                if ($bestTable) {
                    $seatedSession = $this->diningService->seatParty($party, $bestTable);
                    break;
                }
            }

            if (!$seatedSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada meja kosong yang kapasitasnya cocok dengan antrean pelanggan saat ini.',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => "Prioritas antrean tertinggi ({$seatedSession->party->customer_name}, {$seatedSession->party->party_size} orang) berhasil ditempatkan di Meja {$seatedSession->table->code}.",
                'data' => [
                    'session' => $seatedSession->load('table', 'party'),
                ],
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/history
     * Multi-column sortable and searchable history of dining sessions and parties.
     */
    public function history(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $statusFilter = $request->query('status'); // completed, seated, waiting, cancelled
        $partySizeFilter = $request->query('party_size');
        $sortBy = $request->query('sort_by', 'created_at'); // seated_at, completed_at, party_size, customer_name, duration, table_code
        $sortDir = strtolower($request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = DiningSession::with(['table', 'party']);

        if ($search) {
            $query->whereHas('party', function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%");
            })->orWhereHas('table', function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%");
            });
        }

        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        if ($partySizeFilter) {
            $query->whereHas('party', function ($q) use ($partySizeFilter) {
                $q->where('party_size', $partySizeFilter);
            });
        }

        // Handle multi-column sorting
        switch ($sortBy) {
            case 'customer_name':
                $query->join('parties', 'dining_sessions.party_id', '=', 'parties.id')
                    ->orderBy('parties.customer_name', $sortDir)
                    ->select('dining_sessions.*');
                break;
            case 'party_size':
                $query->join('parties', 'dining_sessions.party_id', '=', 'parties.id')
                    ->orderBy('parties.party_size', $sortDir)
                    ->select('dining_sessions.*');
                break;
            case 'table_code':
                $query->join('restaurant_tables', 'dining_sessions.restaurant_table_id', '=', 'restaurant_tables.id')
                    ->orderBy('restaurant_tables.code', $sortDir)
                    ->select('dining_sessions.*');
                break;
            case 'duration':
                $query->orderBy('dining_duration_minutes', $sortDir);
                break;
            case 'started_at':
            case 'seated_at':
                $query->orderBy('started_at', $sortDir);
                break;
            case 'ended_at':
            case 'completed_at':
                $query->orderBy('ended_at', $sortDir);
                break;
            default:
                $query->orderBy('id', $sortDir);
                break;
        }

        $sessions = $query->paginate(15);

        $formattedData = collect($sessions->items())->map(function (DiningSession $session) {
            return [
                'id' => $session->id,
                'customer_name' => $session->party ? $session->party->customer_name : 'N/A',
                'party_size' => $session->party ? $session->party->party_size : 0,
                'table_code' => $session->table ? $session->table->code : 'N/A',
                'table_capacity' => $session->table ? $session->table->capacity : 0,
                'started_at' => $session->started_at ? $session->started_at->toIso8601String() : null,
                'ended_at' => $session->ended_at ? $session->ended_at->toIso8601String() : null,
                'dining_duration_minutes' => $session->dining_duration_minutes,
                'status' => $session->status,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $formattedData,
                'pagination' => [
                    'current_page' => $sessions->currentPage(),
                    'last_page' => $sessions->lastPage(),
                    'per_page' => $sessions->perPage(),
                    'total' => $sessions->total(),
                ],
            ],
        ]);
    }
}
