<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

define('LARAVEL_START', microtime(true));

// Override SCRIPT_NAME and PHP_SELF so Laravel's request parser doesn't strip /api from URL in Vercel CGI
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

// Setup writable storage directories in /tmp for Vercel Serverless
$directories = [
    '/tmp/storage/app/public',
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/logs',
];

foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        @mkdir($dir, 0777, true);
    }
}

// Create empty SQLite DB in /tmp if missing
$sqlitePath = '/tmp/database.sqlite';
if (!file_exists($sqlitePath)) {
    @touch($sqlitePath);
}

// Load Composer Autoloader
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel Application
$app = require_once __DIR__.'/../bootstrap/app.php';

// Bind custom storage path for Vercel
$app->useStoragePath('/tmp/storage');

// Auto seed tables if DB not yet initialized
try {
    if (!Schema::hasTable('restaurant_tables')) {
        Artisan::call('migrate', ['--force' => true]);
        Artisan::call('db:seed', ['--force' => true]);
    }
} catch (\Throwable $e) {
    // Ignore migration errors during boot
}

$kernel = $app->make(Kernel::class);

$request = Request::capture();
$response = $kernel->handle($request);

$response->send();
$kernel->terminate($request, $response);
