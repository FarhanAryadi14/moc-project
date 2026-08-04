<?php

namespace App\Services;

use App\Models\DiningSession;
use App\Models\Party;
use App\Models\RestaurantTable;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DiningService
{
    public function __construct(
        protected TableAssignmentService $tableAssignmentService,
        protected QueuePriorityService $queuePriorityService
    ) {}

    /**
     * Seat a party at a specific table or auto-assigned best-fit table.
     */
    public function seatParty(Party $party, ?RestaurantTable $table = null, ?int $customDurationMinutes = null): DiningSession
    {
        if ($party->status !== 'waiting') {
            throw new InvalidArgumentException("Party is not currently in waiting queue.");
        }

        return DB::transaction(function () use ($party, $table, $customDurationMinutes) {
            // Find best fit table if not provided
            $targetTable = $table ?? $this->tableAssignmentService->findBestFitTable($party->party_size);

            if (!$targetTable) {
                throw new InvalidArgumentException("No suitable table available for party size {$party->party_size}.");
            }

            if ($targetTable->status !== 'available') {
                throw new InvalidArgumentException("Table {$targetTable->code} is currently occupied.");
            }

            if ($party->party_size > $targetTable->capacity) {
                throw new InvalidArgumentException("Party size ({$party->party_size}) exceeds table capacity ({$targetTable->capacity}).");
            }

            // Calculate dining duration: (party * 15) + random(5-15 minutes)
            $durationMinutes = $customDurationMinutes ?? (($party->party_size * 15) + rand(5, 15));
            $now = Carbon::now();
            $estimatedEnd = $now->copy()->addMinutes($durationMinutes);

            // Update Table
            $targetTable->update(['status' => 'occupied']);

            // Update Party
            $party->update([
                'status' => 'seated',
                'seated_at' => $now,
            ]);

            // Create Dining Session
            return DiningSession::create([
                'restaurant_table_id' => $targetTable->id,
                'party_id' => $party->id,
                'dining_duration_minutes' => $durationMinutes,
                'started_at' => $now,
                'estimated_end_at' => $estimatedEnd,
                'status' => 'active',
            ]);
        });
    }

    /**
     * Complete or force complete a dining session.
     */
    public function completeSession(DiningSession $session, bool $isForceComplete = false): array
    {
        $autoSeatedSession = null;

        DB::transaction(function () use ($session, $isForceComplete, &$autoSeatedSession) {
            $now = Carbon::now();
            $session->update([
                'status' => $isForceComplete ? 'force_completed' : 'completed',
                'ended_at' => $now,
            ]);

            $session->party->update([
                'status' => 'completed',
                'completed_at' => $now,
            ]);

            $table = $session->table;
            $table->update(['status' => 'available']);

            // Auto-assign next eligible waiting party to this newly freed table
            $nextParty = $this->queuePriorityService->getNextEligibleParty($table->capacity);
            if ($nextParty) {
                $autoSeatedSession = $this->seatParty($nextParty, $table);
            }
        });

        return [
            'completed_session' => $session->fresh(['table', 'party']),
            'auto_seated_session' => $autoSeatedSession ? $autoSeatedSession->fresh(['table', 'party']) : null,
        ];
    }
}
