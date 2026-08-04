<?php

namespace Tests\Feature;

use App\Models\DiningSession;
use App\Models\Party;
use App\Models\RestaurantTable;
use Database\Seeders\RestaurantSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RestaurantSeeder::class);
    }

    /** Test 1: Validation - Invalid inputs rejected */
    public function test_1_party_arrival_validation_rejects_invalid_input(): void
    {
        // Missing customer_name and invalid party_size (0 and > 8)
        $response = $this->postJson('/api/arrive', [
            'customer_name' => '',
            'party_size' => 10,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_name', 'party_size']);
    }

    /** Test 2: Algorithm - Best fit table assignment (smallest capacity >= party_size) */
    public function test_2_best_fit_table_assignment_places_party_in_smallest_matching_table(): void
    {
        // Party of 3 should get Meja B(4), NOT Meja C(6) or D(8)
        $response = $this->postJson('/api/arrive', [
            'customer_name' => 'Budi 3 Orang',
            'party_size' => 3,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'assigned_table' => 'B',
                    'status' => 'seated',
                ],
            ]);

        $this->assertDatabaseHas('restaurant_tables', [
            'code' => 'B',
            'status' => 'occupied',
        ]);
        $this->assertDatabaseHas('restaurant_tables', [
            'code' => 'A',
            'status' => 'available',
        ]);
    }

    /** Test 3: Algorithm - Queue priority (larger party size first, then arrival time) */
    public function test_3_queue_priority_ordering_prioritizes_larger_party_size(): void
    {
        // Occupy all tables first so new parties enter waiting queue
        RestaurantTable::query()->update(['status' => 'occupied']);

        // Party of 2 arrives first
        $this->postJson('/api/arrive', [
            'customer_name' => 'Small Party',
            'party_size' => 2,
        ]);

        // Party of 6 arrives second
        $this->postJson('/api/arrive', [
            'customer_name' => 'Large Party',
            'party_size' => 6,
        ]);

        $response = $this->getJson('/api/status');

        $response->assertStatus(200);
        $queue = $response->json('data.queue');

        $this->assertCount(2, $queue);
        // Rank 1 should be 'Large Party' (6 orang) because of higher party size priority!
        $this->assertEquals('Large Party', $queue[0]['customer_name']);
        $this->assertEquals(6, $queue[0]['party_size']);
        // Rank 2 should be 'Small Party' (2 orang)
        $this->assertEquals('Small Party', $queue[1]['customer_name']);
    }

    /** Test 4: Logic - Auto assignment on arrival when table available */
    public function test_4_auto_assignment_on_arrival_seats_customer_immediately(): void
    {
        $response = $this->postJson('/api/arrive', [
            'customer_name' => 'Alice',
            'party_size' => 2,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'assigned_table' => 'A', // Meja A capacity 2
                    'status' => 'seated',
                ],
            ]);
    }

    /** Test 5: Logic - Enqueue when no matching table is available */
    public function test_5_party_queued_when_no_table_available(): void
    {
        // Fill all tables (A, B, C, D)
        RestaurantTable::query()->update(['status' => 'occupied']);

        // Arrive another party of 2
        $response = $this->postJson('/api/arrive', [
            'customer_name' => 'Waiting Party',
            'party_size' => 2,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'assigned_table' => null,
                    'status' => 'waiting',
                ],
            ]);
    }

    /** Test 6: Feature - Force complete dining session frees table */
    public function test_6_force_complete_dining_session_frees_table(): void
    {
        // Seat a party at Meja B
        $party = Party::create([
            'customer_name' => 'John',
            'party_size' => 4,
            'status' => 'waiting',
        ]);
        $tableB = RestaurantTable::where('code', 'B')->first();
        $this->postJson('/api/serve', [
            'party_id' => $party->id,
            'table_id' => $tableB->id,
        ]);

        $this->assertDatabaseHas('restaurant_tables', [
            'id' => $tableB->id,
            'status' => 'occupied',
        ]);

        // Force complete Meja B
        $response = $this->postJson('/api/serve', [
            'force_complete_table_id' => $tableB->id,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('restaurant_tables', [
            'id' => $tableB->id,
            'status' => 'available',
        ]);
    }

    /** Test 7: Logic - Auto serve next queued party when table freed */
    public function test_7_auto_serve_next_queued_party_upon_table_completion(): void
    {
        $tableB = RestaurantTable::where('code', 'B')->first();
        $tableB->update(['status' => 'occupied']);

        // Create waiting party of 4 in queue
        $queuedParty = Party::create([
            'customer_name' => 'Next In Line',
            'party_size' => 4,
            'status' => 'waiting',
        ]);

        // Create active session on table B
        $activeParty = Party::create([
            'customer_name' => 'Current Seated',
            'party_size' => 4,
            'status' => 'seated',
        ]);
        DiningSession::create([
            'restaurant_table_id' => $tableB->id,
            'party_id' => $activeParty->id,
            'dining_duration_minutes' => 30,
            'started_at' => now(),
            'estimated_end_at' => now()->addMinutes(30),
            'status' => 'active',
        ]);

        // Force complete active session
        $this->postJson('/api/serve', [
            'force_complete_table_id' => $tableB->id,
        ]);

        // Queued party should now be auto-seated at Table B!
        $this->assertDatabaseHas('parties', [
            'id' => $queuedParty->id,
            'status' => 'seated',
        ]);
    }

    /** Test 8: Feature - History search & multi-column sorting */
    public function test_8_history_filtering_and_sorting(): void
    {
        $tableA = RestaurantTable::where('code', 'A')->first();
        $tableC = RestaurantTable::where('code', 'C')->first();

        $party1 = Party::create(['customer_name' => 'Alpha', 'party_size' => 2, 'status' => 'completed']);
        $party2 = Party::create(['customer_name' => 'Zebra', 'party_size' => 6, 'status' => 'completed']);

        DiningSession::create([
            'restaurant_table_id' => $tableA->id,
            'party_id' => $party1->id,
            'dining_duration_minutes' => 20,
            'started_at' => now()->subMinutes(30),
            'estimated_end_at' => now()->subMinutes(10),
            'ended_at' => now()->subMinutes(10),
            'status' => 'completed',
        ]);

        DiningSession::create([
            'restaurant_table_id' => $tableC->id,
            'party_id' => $party2->id,
            'dining_duration_minutes' => 60,
            'started_at' => now()->subMinutes(70),
            'estimated_end_at' => now()->subMinutes(10),
            'ended_at' => now()->subMinutes(10),
            'status' => 'completed',
        ]);

        // Sort by customer_name desc
        $response = $this->getJson('/api/history?sort_by=customer_name&sort_dir=desc');

        $response->assertStatus(200);
        $items = $response->json('data.items');

        $this->assertEquals('Zebra', $items[0]['customer_name']);
        $this->assertEquals('Alpha', $items[1]['customer_name']);

        // Search filter
        $searchResponse = $this->getJson('/api/history?search=Alpha');
        $searchResponse->assertStatus(200);
        $this->assertCount(1, $searchResponse->json('data.items'));
        $this->assertEquals('Alpha', $searchResponse->json('data.items.0.customer_name'));
    }
}
