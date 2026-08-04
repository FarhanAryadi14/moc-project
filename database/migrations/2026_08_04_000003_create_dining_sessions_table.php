<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dining_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_table_id')->constrained('restaurant_tables')->onDelete('cascade');
            $table->foreignId('party_id')->constrained('parties')->onDelete('cascade');
            $table->integer('dining_duration_minutes');
            $table->timestamp('started_at');
            $table->timestamp('estimated_end_at');
            $table->timestamp('ended_at')->nullable();
            $table->enum('status', ['active', 'completed', 'force_completed'])->default('active');
            $table->timestamps();

            $table->index(['restaurant_table_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dining_sessions');
    }
};
