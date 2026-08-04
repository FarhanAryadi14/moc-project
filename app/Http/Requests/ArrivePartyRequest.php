<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ArrivePartyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'party_size' => ['required', 'integer', 'min:1', 'max:8'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'Nama pelanggan / party wajib diisi.',
            'party_size.required' => 'Jumlah anggota (party size) wajib diisi.',
            'party_size.min' => 'Jumlah party minimal 1 orang.',
            'party_size.max' => 'Jumlah party maksimal 8 orang (sesuai kapasitas meja terbesar).',
        ];
    }
}
