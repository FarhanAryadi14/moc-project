<?php

namespace App\Services;

use App\Models\Party;
use App\Models\RestaurantTable;
use Illuminate\Database\Eloquent\Collection;

class TableAssignmentService
{
    /**
     * Find the best fit available table for a given party size.
     * Rule: Assign to the closest matching table (smallest capacity >= party_size).
     */
    public function findBestFitTable(int $partySize): ?RestaurantTable
    {
        return RestaurantTable::query()
            ->where('status', 'available')
            ->where('capacity', '>=', $partySize)
            ->orderBy('capacity', 'asc') // closest capacity fit
            ->orderBy('code', 'asc')     // deterministic tie-breaker
            ->first();
    }

    /**
     * Get all available tables.
     */
    public function getAvailableTables(): Collection
    {
        return RestaurantTable::query()
            ->where('status', 'available')
            ->orderBy('capacity', 'asc')
            ->get();
    }
}
