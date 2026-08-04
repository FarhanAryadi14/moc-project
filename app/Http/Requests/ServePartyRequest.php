<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServePartyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'party_id' => ['nullable', 'integer', 'exists:parties,id'],
            'table_id' => ['nullable', 'integer', 'exists:restaurant_tables,id'],
            'force_complete_table_id' => ['nullable', 'integer', 'exists:restaurant_tables,id'],
        ];
    }
}
