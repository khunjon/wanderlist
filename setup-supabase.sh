#!/bin/bash

# Supabase Setup Script for Placemarks
# This script helps you set up your Supabase project

echo "🚀 Placemarks Supabase Setup"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cp env.example .env.local
    echo "✅ Created .env.local from template"
    echo ""
    echo "⚠️  IMPORTANT: Please update .env.local with your actual Supabase credentials:"
    echo "   1. Go to your Supabase project dashboard"
    echo "   2. Navigate to Settings > API"
    echo "   3. Copy your Project URL and API keys"
    echo "   4. Update the values in .env.local"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Check if Supabase client is installed
if npm list @supabase/supabase-js > /dev/null 2>&1; then
    echo "✅ @supabase/supabase-js is already installed"
else
    echo "📦 Installing @supabase/supabase-js..."
    npm install @supabase/supabase-js
    echo "✅ Supabase client installed"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. 🌐 Create your Supabase project:"
echo "   - Go to https://supabase.com"
echo "   - Click 'New Project'"
echo "   - Choose your organization and enter project details"
echo "   - Wait for provisioning (2-3 minutes)"
echo ""
echo "2. 🗄️  Set up your database:"
echo "   - Go to SQL Editor in your Supabase dashboard"
echo "   - Copy and paste the contents of 'supabase-schema.sql'"
echo "   - Run the SQL commands"
echo ""
echo "3. 📁 Set up Storage:"
echo "   - Go to Storage in your Supabase dashboard"
echo "   - Create a new bucket called 'profile-photos'"
echo "   - Set it to Public"
echo "   - Run the storage policies from the SQL file"
echo ""
echo "4. 🔐 Configure Authentication:"
echo "   - Go to Authentication > Settings"
echo "   - Configure your auth providers (Email, Google OAuth)"
echo "   - Add your redirect URLs"
echo ""
echo "5. 🔑 Update Environment Variables:"
echo "   - Copy your Project URL and API keys from Settings > API"
echo "   - Update .env.local with your actual values"
echo ""
echo "6. 🧪 Test the setup:"
echo "   - Run 'npm run dev'"
echo "   - Test user registration and authentication"
echo "   - Verify database operations work correctly"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - supabase-setup.md"
echo "   - https://supabase.com/docs"
echo ""
echo "🎉 Happy coding!" 