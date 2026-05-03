import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  return handleRequest(req, params);
}

export async function POST(req, { params }) {
  return handleRequest(req, params);
}

export async function PUT(req, { params }) {
  return handleRequest(req, params);
}

export async function DELETE(req, { params }) {
  return handleRequest(req, params);
}

async function handleRequest(req, params) {
  try {
    const token = req.cookies.get("token")?.value;

    const url = `http://localhost:3001/${params.path.join("/")}`;

    const body = req.method !== "GET" ? await req.text() : undefined;

    const backendRes = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const data = await backendRes.text();

    return new NextResponse(data, {
      status: backendRes.status,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Proxy error" },
      { status: 500 }
    );
  }
}