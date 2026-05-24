// -*- coding: utf-8 -*-
import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const payload = await request.json();
    const { status, admin_notes } = payload;

    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      console.warn(`⚠️ DATABASE_URL is missing! Mocking update for lead ID ${id}.`);
      return NextResponse.json({ success: true, offline: true, message: `Lead ${id} updated offline.` });
    }

    const client = new Client({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    await client.connect();

    // Dynamically build update fields
    let query = "UPDATE leads SET ";
    const params_list = [];
    let param_index = 1;

    if (status !== undefined) {
      query += `status = $${param_index}, `;
      params_list.push(status);
      param_index++;
    }

    if (admin_notes !== undefined) {
      query += `admin_notes = $${param_index}, `;
      params_list.push(admin_notes);
      param_index++;
    }

    // Remove trailing comma and space
    query = query.slice(0, -2);
    
    // Add WHERE clause
    query += ` WHERE id = $${param_index};`;
    params_list.push(id);

    await client.query(query, params_list);
    await client.end();

    console.log(`✅ Successfully updated lead ID ${id} in database.`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(`❌ Error in PATCH /api/admin/leads/[id]:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      console.warn(`⚠️ DATABASE_URL is missing! Mocking deletion for lead ID ${id}.`);
      return NextResponse.json({ success: true, offline: true, message: `Lead ${id} deleted offline.` });
    }

    const client = new Client({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    await client.connect();

    const deleteQuery = "DELETE FROM leads WHERE id = $1;";
    await client.query(deleteQuery, [id]);
    await client.end();

    console.log(`🗑️ Successfully deleted lead ID ${id} from database.`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(`❌ Error in DELETE /api/admin/leads/[id]:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
