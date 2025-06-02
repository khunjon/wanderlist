import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { auth } from '@/lib/firebase/config';
import { getUserProfile } from '@/lib/firebase/user';

// Helper function to verify admin access
async function verifyAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    // In a real app, you'd verify the Firebase ID token here
    // For now, we'll extract the user ID from the token and check admin status
    const token = authHeader.split('Bearer ')[1];
    // This is a simplified approach - in production, use Firebase Admin SDK
    const userId = token; // Assuming the token is just the user ID for this example
    
    const userProfile = await getUserProfile(userId);
    return userProfile?.isAdmin ? userProfile : null;
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await verifyAdminAccess(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total user count
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get top lists by view count
    const topListsQuery = query(
      collection(db, 'lists'),
      orderBy('viewCount', 'desc'),
      limit(10)
    );
    const topListsSnapshot = await getDocs(topListsQuery);
    const topLists = topListsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        viewCount: data.viewCount || 0,
        userId: data.userId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });

    // Get data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get new users by day (last 30 days)
    const newUsersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const newUsersSnapshot = await getDocs(newUsersQuery);
    
    // Get new lists by day (last 30 days)
    const newListsQuery = query(
      collection(db, 'lists'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const newListsSnapshot = await getDocs(newListsQuery);

    // Process data for charts
    const usersByDay: { [key: string]: number } = {};
    const listsByDay: { [key: string]: number } = {};

    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      usersByDay[dateKey] = 0;
      listsByDay[dateKey] = 0;
    }

    // Count new users by day
    newUsersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date();
      const dateKey = createdAt.toISOString().split('T')[0];
      if (usersByDay.hasOwnProperty(dateKey)) {
        usersByDay[dateKey]++;
      }
    });

    // Count new lists by day
    newListsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date();
      const dateKey = createdAt.toISOString().split('T')[0];
      if (listsByDay.hasOwnProperty(dateKey)) {
        listsByDay[dateKey]++;
      }
    });

    // Convert to chart data format
    const chartData = Object.keys(usersByDay)
      .sort()
      .map(date => ({
        date,
        newUsers: usersByDay[date],
        newLists: listsByDay[date],
      }));

    return NextResponse.json({
      totalUsers,
      topLists,
      chartData,
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 