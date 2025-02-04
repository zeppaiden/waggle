# Project Requirements Document (PRD)

## 1. Project Overview

- **Project Name:** _Adoptr_ (working title)
- **Primary Purpose:**  
  Provide a lean application that facilitates pet adoptions, training videos, and additional pet-focused content. The focus is on a consumer-centric experience where users can quickly browse, favorite, and interact with pet profiles.
- **Unique Value Proposition:**  
  A Tinder-like swiping interface tailored for pet profiles that not only allows users to browse but also to directly contact sellers/breeders through an integrated chat.

---

## 2. Target Audience

- **Consumers:**  
  Pet enthusiasts, prospective pet owners, and individuals interested in training/information videos on pet care.
- **Stakeholders:**  
  Pet sellers (breeders, shelters) who want straightforward ways to showcase their pets, and possibly partners like pet tracking companies (e.g., SpotOn).

---

## 3. Core Features and Functionality (MVP)

### 3.1. User Authentication

- **Description:**  
  Implement a sign-up/sign-in flow.
- **Implementation:**  
  Use Firebase Auth for secure and simple user authentication.
  
### 3.2. Video Timeline & Pet Profiles

- **Feed/Timeline:**  
  A scrollable timeline (or card stack) displaying pet profiles.
  
- **Profile Card Elements:**  
  - Looping video of the pet as the main content.
  - Basic pet details, including:
    - **Name**
    - **Location**
    - **Age**

- **Swipe Mechanism:**  
  - **Swipe Right:**  
    Favorite the pet profile and prompt the user to contact the seller. Also, track swipe statistics.
  - **Swipe Left:**  
    Dismiss the pet profile.
  - **Swipe Up:**  
    Expand the card to reveal additional details (e.g., owner's/seller's name, further pet information).

### 3.3. Additional Interactions

- **Interactions Beyond Swiping:**  
  - **Favoriting:** Manually mark a profile as a favorite.
  - **Sharing:** Provide a means to share pet profiles on social media or via other channels.
  - **Chat:** Enable in-app chat functionality so that once a pet is favorited, the user can initiate direct contact with the seller.

### 3.4. Media Management

- **Hosting:**  
  Store and stream pet video content.
- **Options:**  
  Use Firebase Cloud Storage for simplicity or integrate with Mux if advanced video streaming features are needed later.

### 3.5. Notifications

- **Firebase Cloud Messaging:**  
  Use push notifications to inform users about actions such as:
  - New pet profiles being added.
  - Responses from sellers after a chat or contact request.

### 3.6. Future AI Enhancements (Phase 2)

- **Personalization:**  
  Use AI to provide personalized pet recommendations based on swipe behavior.
- **Additional Capabilities:**  
  Incorporate image recognition for verifying pet breeds or natural language processing to assist with chat interactions.

---

## 4. User Stories (Consumer Approach)

Based on our discussion, here are six key user stories for the consumer side:

1. **Swipe Right to Favorite:**  
   _"As a consumer, I want to swipe right on a pet's profile to mark it as a favorite, so I can quickly save interesting pets."_

2. **Swipe Left to Dismiss:**  
   _"As a consumer, I want to swipe left to ignore pet profiles I’m not interested in, ensuring I only see relevant pets."_

3. **Swipe Up for Details:**  
   _"As a consumer, I want to swipe up to see additional information about a pet (e.g., age, interests, seller’s name), so I have all the details needed before contacting the seller."_

4. **Initiate Chat with Seller:**  
   _"As a consumer, I want to start a chat with the seller directly from the pet's profile, so I can inquire or negotiate in real-time."_

5. **Engage with a Video Timeline:**  
   _"As a consumer, I want a continuously updating feed of pet profiles featuring looping videos, so I can engage visually with the content."_

6. **Share Pet Profiles:**  
   _"As a consumer, I want to share pet profiles with my friends via social media, so I can spread awareness about pets I find interesting."_

---

## 5. Technical Specifications

### 5.1. Tech Stack

- **Frontend:**  
  - **Current:** Expo & React Native (for ease of development using an LLM).
  - **Option to Switch:** Consider Swift if it offers notable advantages in UI/UX design.
- **Backend:**  
  - Firebase for backend services, including:
    - **Authentication (Firebase Auth)**
    - **Real-time Data & Pet Profiles (Firestore)**
    - **Media Storage (Firebase Cloud Storage)**

### 5.2. Architecture Considerations

- **Firebase Integration:**  
  Use Firebase’s built-in services to simplify the connection between authentication, data storage, and media hosting.
- **Performance:**  
  Focus on a responsive swiping interface and a performant video timeline. Surface-level performance enhancements are acceptable at this stage.
  
### 5.3. Media & Video Handling

- **Primary Storage:**  
  Firebase Cloud Storage for hosting pet videos.
- **Alternate Option:**  
  Mux can be evaluated later if there are significant benefits in video processing or streaming capabilities.

---

## 6. UI/UX and Design Considerations

- **Inspiration:**  
  Draw from Tinder’s gesture-based interactions, adapted for pet profiles, and look to SpotOn’s polished UI/UX as a benchmark.
- **Key Experience Elements:**  
  - Intuitive swipe gestures (right, left, up) with clear associated actions.
  - Modern integration features like animations, haptics (vibration), sounds, and notifications.
- **Future Design Enhancements:**  
  Incorporate more sophisticated animations and user feedback mechanisms as the app matures.

---

## 7. Milestones and Timeline

- **Week 1 (Rapid Development):**
  - Set up Firebase authentication.
  - Develop the basic video timeline with pet profiles.
  - Implement swiping functionality (right for favorite, left to dismiss, up for details).
  - Host a looping video per profile with basic details (name, location, age).

- **Week 2 (Enhanced Features & AI Integration):**
  - Integrate the chat feature for contacting sellers.
  - Expand pet detail view (swipe-up interaction) to include full profile information.
  - Begin implementing push notifications via Firebase Cloud Messaging.
  - Lay the groundwork for future AI-driven personalization features.

---

## 8. Future Enhancements

- **Incorporated Analytics:**  
  While out-of-scope for the MVP, consider integrating swipe statistics (like count of right swipes) as a precursor to future personalization.
- **AI Features:**  
  Advanced AI capabilities (e.g., personalized recommendations, breed verification) will be planned after the MVP launch.
- **UI/UX Enhancements:**  
  Invest in improved animations, detailed mockups/wireframes, and possibly leveraging tools or AI services to assist with design if needed.
  