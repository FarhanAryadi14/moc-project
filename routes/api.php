<?php

use App\Http\Controllers\Api\RestaurantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| - POST /api/arrive  : Party arrives, auto-assigns or enqueues
| - GET  /api/status  : Real-time table statuses, timer benchmarks & queue
| - POST /api/serve   : Serve party from queue / seat party / force complete
| - GET  /api/history : Searchable & multi-column sortable history
|
*/

Route::post('/arrive', [RestaurantController::class, 'arrive']);
Route::get('/status', [RestaurantController::class, 'status']);
Route::post('/serve', [RestaurantController::class, 'serve']);
Route::get('/history', [RestaurantController::class, 'history']);
