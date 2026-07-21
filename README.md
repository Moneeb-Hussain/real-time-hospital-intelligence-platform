# AegisOps AI: Real-Time Hospital Operations Command Center

AI-powered decision support for smarter, faster emergency room operations.

A real-time hospital operations platform that helps healthcare professionals prioritize patients, manage limited resources, and make informed decisions during emergencies. By combining clinical rules with OpenAI GPT-5.6, the platform provides intelligent, explainable recommendations while ensuring that medical professionals remain in full control of every decision.

📚 Table of Contents:
Overview
Inspiration
Features
How We Built It
AI Integration
Tech Stack
System Architecture
Getting Started
API
Database
Testing
Deployment
Team
License

💡 Inspiration:

Emergency rooms operate in a high-pressure environment where every second matters. Doctors and nurses constantly balance patient care with limited beds, equipment, and available staff.
While observing these real-world challenges, we asked ourselves:
What if AI could assist healthcare teams by organizing information and suggesting the best operational decisions in real time?
That idea inspired us to build the Real-Time Hospital Intelligence Platform—an AI-powered command center that supports hospital staff with patient prioritization, intelligent resource allocation, and explainable recommendations without replacing human decision-making.

✨ Features:

🩺 Intelligent Patient Triage:
Calculates urgency scores (0–100)
Automatically classifies patients (P1–P4)
Evaluates vital signs and symptoms using clinical rules
Prioritizes critical patients instantly

🏥 Smart Resource Management:
Live monitoring of ICU and ER bed availability
Tracks doctor workload
Monitors medical equipment
Suggests optimal resource allocation
Generates alternative plans when resources are limited

🤖 AI Decision Support:

Powered by OpenAI GPT-5.6
The AI analyzes patient conditions together with available hospital resources to generate recommendations that include:
Recommended action
Assigned department
Required resources
Clinical reasoning
Alternative plan
Confidence score
Every recommendation is transparent and fully explainable.

📊 Real-Time Dashboard
The dashboard provides:
Live patient queue
Resource availability
Emergency alerts
Estimated waiting times
Hospital status overview

👨‍⚕️ Human-in-the-Loop:

AI supports healthcare professionals—it never replaces them.
Hospital staff can:
Review every recommendation
Approve or reject suggestions
Override AI decisions
Maintain a complete audit history

🛠️ How We Built It:

Planning
Designed the database schema
Defined REST APIs
Planned the application architecture
Backend
Developed using FastAPI
Built the patient priority engine
Integrated Supabase for data storage
AI
Integrated OpenAI GPT-5.6
Engineered structured prompts
Added rule-based fallback recommendations
Frontend
Built with React
Created a responsive dashboard
Added real-time updates
Deployment
Hosted on Render
Version controlled with GitHub

🤖 AI Integration:

OpenAI Codex
Codex accelerated development by helping us:
Generate FastAPI boilerplate
Create Pydantic models
Write Supabase queries
Produce API documentation
GPT-5.6
GPT-5.6 serves as the platform's intelligent decision-support engine.
It:
Analyzes patient conditions
Reviews available hospital resources
Generates operational recommendations
Explains every decision
Suggests backup plans when resources are unavailable
If AI is unavailable, the platform automatically switches to rule-based recommendations to ensure continuous operation.

💻 Tech Stack:

Category	Technology
Backend	Python, FastAPI
Frontend	React, Tailwind CSS
Database	Supabase (PostgreSQL)
AI	OpenAI GPT-5.6
Code Generation	OpenAI Codex
Deployment	Render
Version Control	GitHub

🏗️ System Architecture:

React Frontend
        │
        ▼
 FastAPI Backend
 ├── Patient Triage
 ├── Resource Manager
 ├── GPT-5.6 Service
 ├── Validation Layer
 └── Audit Logs
        │
        ▼
 Supabase Database

🚀 Getting Started:

Clone the repository
git clone https://github.com/yourusername/real-time-hospital-intelligence-platform.git
cd real-time-hospital-intelligence-platform
Install dependencies
pip install -r app/requirements.txt
Configure environment variables
SUPABASE_URL=
SUPABASE_KEY=
OPENAI_API_KEY=
PORT=8000
Run the project
python main.py

📡 API Endpoints:

Method	Endpoint	Description
GET	/health	Health Check
POST	/api/patient	Register Patient
GET	/api/dashboard	Dashboard Data
POST	/api/patient/approve	Approve AI Recommendation

🗄️ Database:

The system stores:
Patients
Hospital Resources
Patient Queue
Audit Logs
using Supabase PostgreSQL.

🧪 Testing:

Run all tests:
pytest tests/
Run with coverage:
pytest --cov=app tests/

🚀 Deployment

The application is deployed on Render.
Deployment includes:
Automatic GitHub deployment
Environment variable configuration
FastAPI production server
API documentation

👥 Team:

Name	            Role
Subhan Asif	    Backend Developer
Zahra Khaliq	  Backend Developer
Tayyab	        AI/ML Engineer
Moneeb Hussain	AI/ML Engineer
Areeba	        AI/ML Engineer
Samiullah	      Frontend Developer

🙏 Acknowledgements:

Special thanks to:
OpenAI
FastAPI
Supabase
Render
