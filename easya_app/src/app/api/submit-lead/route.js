// -*- coding: utf-8 -*-
import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request) {
  try {
    const payload = await request.json();
    const { name, phone, university, service, level, qty, deadline, price_estimate } = payload;

    // Server-side validation
    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin liên hệ của học viên.' }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      // Robust offline fallback for local testing without database
      console.warn("⚠️ DATABASE_URL environment variable is missing! Lead saved in local application logs:");
      console.log("==========================================");
      console.log(`- Student Name: ${name}`);
      console.log(`- Phone: ${phone}`);
      console.log(`- University: ${university}`);
      console.log(`- Service: ${service}`);
      console.log(`- Level: ${level}`);
      console.log(`- Qty: ${qty}`);
      console.log(`- Deadline: ${deadline}`);
      console.log(`- Price Estimate: ${price_estimate}`);
      console.log("==========================================");
      
      return NextResponse.json({ 
        success: true, 
        lead_id: 'LOCAL_OFFLINE_LOG', 
        message: 'Đã nhận yêu cầu (Chế độ kiểm thử Offline)' 
      });
    }

    // Connect to PostgreSQL database
    const client = new Client({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    await client.connect();

    // Self-healing database check: Automatically create the table if it does not exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        university VARCHAR(255),
        service VARCHAR(255),
        level VARCHAR(255),
        qty VARCHAR(100),
        deadline VARCHAR(255),
        price_estimate VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createTableQuery);

    // Insert student lead details
    const insertQuery = `
      INSERT INTO leads (name, phone, university, service, level, qty, deadline, price_estimate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
    `;
    const res = await client.query(insertQuery, [
      name, 
      phone, 
      university, 
      service, 
      level, 
      qty, 
      deadline, 
      price_estimate
    ]);

    const insertedId = res.rows[0].id;
    await client.end();

    console.log(`✅ Successfully saved Lead ID ${insertedId} into PostgreSQL database for student ${name}`);

    return NextResponse.json({ success: true, lead_id: insertedId });

  } catch (error) {
    console.error('❌ Error handling API lead submission:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
