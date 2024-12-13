import { createClerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await clerk.users.getUser(params.id);
    
    return NextResponse.json({
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddresses[0]?.emailAddress,
      phoneNumber: user.phoneNumbers[0]?.phoneNumber,
      imageUrl: user.imageUrl,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 