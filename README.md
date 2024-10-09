#Trendify

Trendify is a social media application designed for users to share and discover videos,
engage with each other, and manage their profiles effortlessly. Built with a focus on user experience,
Trendify leverages modern technologies to provide a seamless and interactive platform.

Features
-User Authentication: Secure user authentication using Clerk for easy sign-up and login.
-Video Sharing: Users can upload, view, and interact with videos shared by others.
-Profile Management: Users can customize their profiles, including updating their profile images and usernames.
-Likes and Engagement: Users can like videos, encouraging interaction within the community.
-Responsive Design: Built with React Native and Expo, Trendify offers a smooth experience on both iOS and Android devices.

Tech Stack
-Frontend: React Native with Expo for building cross-platform mobile applications.
-Authentication: Clerk for user authentication and session management.
-Database: Supabase as the backend database for user and video data storage.
-File Storage: Amazon S3 for storing user-uploaded media such as profile images and videos.

Getting Started
Before you can run this application, you need to set up accounts with the following services to obtain the necessary API keys:
-Expo:
Sign up at Expo.
Create a new project on Expo.

-Supabase:
Go to Supabase and create an account.
Set up a new project and configure your database.
Obtain your Supabase API URL and API key.

-Clerk:
Create an account at Clerk.
Set up a new application and generate your API keys.

-Amazon S3 (if you're using it for file storage):
Sign up for an AWS account at AWS.
Set up an S3 bucket for storing your media files.

-Clone the repository:
git clone https://github.com/yourusername/trendify.git

-Navigate to the project directory:
cd trendify

-Install the required dependencies:
npm install

-Create a .env file in the root of the project and add your API keys:
REACT_NATIVE_EXPO_API_KEY=your_expo_api_key
SUPABASE_URL=your_supabase_api_url
SUPABASE_KEY=your_supabase_api_key
CLERK_FRONTEND_API=your_clerk_frontend_api
CLERK_API_KEY=your_clerk_api_key
AWS_S3_BUCKET=your_aws_s3_bucket

-Running the App
To start the application, use the following command:
npx expo start

Follow the on-screen instructions to open the app on a simulator or physical device.
