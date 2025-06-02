import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(request: NextRequest) {
  try {
    // For now, we'll skip complex auth verification and just return the data
    // In production, you'd want to implement proper Firebase Admin SDK verification
    
    // Get total user count
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get top lists by view count (handle case where viewCount might not exist)
    let topLists = [];
    try {
      const topListsQuery = query(
        collection(db, 'lists'),
        orderBy('viewCount', 'desc'),
        limit(10)
      );
      const topListsSnapshot = await getDocs(topListsQuery);
      topLists = topListsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Untitled List',
          viewCount: data.viewCount || 0,
          userId: data.userId || 'Unknown',
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      });
    } catch (orderError) {
      // If ordering by viewCount fails (field doesn't exist), get all lists and sort manually
      console.log('ViewCount field might not exist, fetching all lists...');
      const allListsSnapshot = await getDocs(collection(db, 'lists'));
      const allLists = allListsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Untitled List',
          viewCount: data.viewCount || 0,
          userId: data.userId || 'Unknown',
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      });
      
      // Sort by viewCount and take top 10
      topLists = allLists
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 10);
    }

    // Get data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get new users by day (last 30 days)
    let newUsersSnapshot;
    try {
      const newUsersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
      );
      newUsersSnapshot = await getDocs(newUsersQuery);
    } catch (userError) {
      console.log('Error querying users by date, using all users...');
      newUsersSnapshot = await getDocs(collection(db, 'users'));
    }
    
    // Get new lists by day (last 30 days)
    let newListsSnapshot;
    try {
      const newListsQuery = query(
        collection(db, 'lists'),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
      );
      newListsSnapshot = await getDocs(newListsQuery);
    } catch (listError) {
      console.log('Error querying lists by date, using all lists...');
      newListsSnapshot = await getDocs(collection(db, 'lists'));
    }

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
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 