<?php

namespace Database\Seeders;

use App\Models\RestaurantTable;
use Illuminate\Database\Seeder;

class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $tables = [
            ['code' => 'A', 'capacity' => 2, 'status' => 'available'],
            ['code' => 'B', 'capacity' => 4, 'status' => 'available'],
            ['code' => 'C', 'capacity' => 6, 'status' => 'available'],
            ['code' => 'D', 'capacity' => 8, 'status' => 'available'],
        ];

        foreach ($tables as $table) {
            RestaurantTable::updateOrCreate(
                ['code' => $table['code']],
                ['capacity' => $table['capacity'], 'status' => $table['status']]
            );
        }
    }
}
