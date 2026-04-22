# Kinetic Vault 🛡️

**Kinetic Vault** is a full-stack, cross-platform cybersecurity companion application and service. It empowers users to analyze suspicious data, extract insights from images or text using Optical Character Recognition (OCR), and generate detailed security reports leveraging advanced AI models.

---

## 🚀 Features

- **Cross-Platform Mobile App**: Built with React Native CLI, ready for both iOS and Android. Features dynamic UI elements and smooth animations powered by React Native Reanimated and Lottie.
- **AI-Powered Analysis**: Seamlessly integrates with **Google Gemini 1.5/2.0 Flash APIs** for rapid evaluation of potential cybersecurity threats, logs, or suspicious texts.
- **Reliable Model Fallbacks**: Implements robust logic to switch between Gemini models automatically if a specific model or version is unavailable or rate-limited.
- **Optimized Connectivity**: Intelligent backend host detection ensuring seamless communication from both physical devices (via ADB reverse) and emulators.
- **On-Device OCR**: Extracts text from images and documents utilizing **Tesseract OCR (Tess4J)**.
- **Professional Report Generation**: Automatically compiles findings into downloadable, structured PDF reports using **iText 7**.
- **Secure Data Storage**: Stores user interactions and generated reports in a cloud-based **MongoDB Atlas** cluster.
- **Modern Backend Architecture**: High-performance REST APIs structured with Spring Boot (Java 17) featuring proactive error handling.

---

## 💻 Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native CLI (`react-native` v0.85)
- **Navigation**: React Navigation v7
- **UI & Animations**: Reanimated v4, Lottie React Native, React Native Linear Gradient, Vector Icons
- **HTTP Client**: Axios (with custom interceptors for enhanced debugging)

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
