<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Party extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'party_size',
        'status',
        'arrived_at',
        'seated_at',
        'completed_at',
    ];

    protected $casts = [
        'arrived_at' => 'datetime',
        'seated_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function diningSession(): HasOne
    {
        return $this->hasOne(DiningSession::class);
    }
}
