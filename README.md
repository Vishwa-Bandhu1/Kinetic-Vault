# Kinetic Vault: AI-Powered SMS & Phishing Protection 🛡️

**Kinetic Vault** is a full-stack, cross-platform cybersecurity companion application designed to protect users from scam conversations and phishing threats. It leverages advanced AI models to analyze suspicious texts, extracts insights from images using OCR, and provides real-time protection against malicious SMS messages.

---

## 🚀 Features

- **Real-Time SMS Protection**: Automatically intercepts and analyzes incoming SMS messages for phishing links and scam intent using a native Android BroadcastReceiver.
- **AI-Powered Analysis**: Seamlessly integrates with **Google Gemini 1.5/2.0 Flash APIs** for rapid evaluation of potential cybersecurity threats.
- **OEM-Specific Optimization**: Specialized fallback mechanisms for **Realme, Oppo, and Vivo** devices to ensure reliable background detection despite aggressive battery management.
- **Cross-Platform Mobile App**: Built with React Native CLI, featuring a premium dark-mode UI with smooth animations (Reanimated v4, Lottie).
- **On-Device OCR**: Extracts text from screenshots and suspicious documents utilizing **Tesseract OCR**.
- **Professional Security Reports**: Automatically compiles findings into downloadable, structured PDF reports using **iText 7**.
- **Secure Cloud Sync**: Stores analysis history and reports securely in a **MongoDB Atlas** cluster.
- **Modern Backend**: High-performance REST APIs structured with Spring Boot 3 featuring proactive error handling and model fallbacks.

---

## 💻 Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native CLI (`react-native` v0.85)
- **Navigation**: React Navigation v7
- **UI & Animations**: Reanimated v4, Lottie React Native, React Native Linear Gradient
- **Native Modules**: Custom Kotlin modules for SMS interception and system settings access.

### Backend (Server)
- **Framework**: Spring Boot 3.4.5 (Java 17)
- **Database**: MongoDB (Spring Data MongoDB)
- **OCR Engine**: Tess4J (Tesseract v5.11)
- **PDF Generation**: iText 7 Core
- **AI Integration**: Google Generative AI (Gemini 1.5/2.0 Flash)

---

## 🛠️ Prerequisites

To run this project locally, ensure you have the following installed:

- **Node.js** (v22+) & npm/yarn
- **React Native Development Environment**: Android Studio / Xcode configured for CLI.
- **Java Development Kit (JDK)**: Version 17
- **Apache Maven**: For building the Spring Boot application.
- **Tesseract OCR Language Data**: Specifically the `tessdata` folder containing `eng.traineddata`.
- **Google AI Studio Account**: To obtain a Gemini API Key.
- **MongoDB Atlas Cluster**: Or a local MongoDB instance.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Vishwa-Bandhu1/Kinetic-Vault.git
cd Kinetic-Vault
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd kineticvault-backend
   ```
2. **Configure Secrets**:
   Copy the example properties file and fill in your credentials.
   ```bash
   cp src/main/resources/application.properties.example src/main/resources/application.properties
   ```
   Open `application.properties` and add your:
   - MongoDB connection string.
   - Google Gemini API Key.
3. Build and run the server:
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```
   *The server will start on port 8080 by default.*

### 3. Frontend Setup
1. Navigate to the app directory:
   ```bash
   cd KineticVaultApp
   ```
2. Install dependencies:
   ```bash
   npm install
   # or yarn install
   ```
3. Run the application:
   - **For Android**:
     ```bash
     # If using a physical device, run:
     adb reverse tcp:8080 tcp:8080
     npm run android
     ```
   - **For iOS** *(macOS only)*:
     ```bash
     cd ios && pod install && cd ..
     npm run ios
     ```

---

## 🛡️ License

This project is licensed under the MIT License - see the `LICENSE` file for details.

