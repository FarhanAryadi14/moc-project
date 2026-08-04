<?php

use App\Http\Controllers\Api\RestaurantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web & API Direct Routes (Supports both /api/* and stripped CGI paths)
|--------------------------------------------------------------------------
*/

Route::post('/api/arrive', [RestaurantController::class, 'arrive']);
Route::post('/arrive', [RestaurantController::class, 'arrive']);

Route::get('/api/status', [RestaurantController::class, 'status']);
Route::get('/status', [RestaurantController::class, 'status']);

Route::post('/api/serve', [RestaurantController::class, 'serve']);
Route::post('/serve', [RestaurantController::class, 'serve']);

Route::get('/api/history', [RestaurantController::class, 'history']);
Route::get('/history', [RestaurantController::class, 'history']);

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
