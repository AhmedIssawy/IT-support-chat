// Labels and text content for chat widget based on user role

export const getChatLabels = (isAdmin) => {
  if (isAdmin) {
    return {
      // Floating button
      promptText: "Want to reach out to users? Click the chat button to start a conversation.",
      buttonAriaLabel: "Contact users",
      
      // Admin/User list panel
      panelTitle: "👨‍💼 User Messages",
      panelSubtext: "Select a user to assist or follow up with",
      panelEmptyTitle: "No users available",
      panelEmptyText: "No users to contact at the moment",
      panelFooter: "Stay connected and help your users in real time",
      personLabel: "user",
      
      // Chat panel
      chatWelcomeEmoji: "👋",
      chatWelcomeTitle: "Welcome, Support Admin",
      chatWelcomeText: "Start a conversation with",
      backButtonLabel: "Back to user list",
      
      // Page content
      pageTitle: "Admin Dashboard",
      pageSubtitle: "Manage user conversations and provide support"
    };
  } else {
    return {
      // Floating button
      promptText: "Need help? Click the chat button to connect with our support team.",
      buttonAriaLabel: "Open chat support",
      
      // Admin/User list panel
      panelTitle: "💬 Support Team",
      panelSubtext: "Choose an admin to chat with",
      panelEmptyTitle: "No admins available",
      panelEmptyText: "Please try again later",
      panelFooter: "Typically replies within a few minutes",
      personLabel: "admin",
      
      // Chat panel
      chatWelcomeEmoji: "👋",
      chatWelcomeTitle: "Welcome to Support Chat",
      chatWelcomeText: "Send a message to",
      backButtonLabel: "Back to admin list",
      
      // Page content
      pageTitle: "Welcome to Support Chat",
      pageSubtitle: "Need help? Click the chat button to connect with our support team"
    };
  }
};
