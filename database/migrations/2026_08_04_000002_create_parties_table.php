<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parties', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->integer('party_size');
            $table->enum('status', ['waiting', 'seated', 'completed', 'cancelled'])->default('waiting');
            $table->timestamp('arrived_at')->useCurrent();
            $table->timestamp('seated_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'party_size', 'arrived_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parties');
    }
};
