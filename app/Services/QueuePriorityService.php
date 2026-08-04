<?php

namespace App\Services;

use App\Models\Party;
use Illuminate\Database\Eloquent\Collection;

class QueuePriorityService
{
    /**
     * Get waiting queue ordered by highest party size first, then arrival time (FIFO for ties).
     */
    public function getOrderedQueue(): Collection
    {
        return Party::query()
            ->where('status', 'waiting')
            ->orderBy('party_size', 'desc')
            ->orderBy('arrived_at', 'asc')
            ->get();
    }

    /**
     * Find the next highest priority party that can fit in a table of given capacity.
     */
    public function getNextEligibleParty(int $tableCapacity): ?Party
    {
        return Party::query()
            ->where('status', 'waiting')
            ->where('party_size', '<=', $tableCapacity)
            ->orderBy('party_size', 'desc')
            ->orderBy('arrived_at', 'asc')
            ->first();
    }
}
