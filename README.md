# AI Restaurant Assistant 🍽️🤖

## Overview

AI-powered voice assistant that allows users to **call a number, speak with an AI, and make a restaurant reservation**. The project explores **voice-to-AI interaction, LLM processing, and API-based reservation management**.

## Features

✅ **Offline AI Processing** with Llama.cpp  
✅ **GraphQL API** using FastAPI or Express  
✅ **PostgreSQL Database** for storing reservations  
✅ **React Dashboard** for managing bookings  
✅ **Containerized Setup** using Docker

## Tech Stack

-   **AI Model:** Llama.cpp (Offline)
-   **Backend:** FastAPI (Python) or Express (Node.js) + GraphQL
-   **Database:** PostgreSQL
-   **Frontend:** React (Next.js)
-   **Infrastructure:** Docker + Docker Compose

## Project Structure

ai-restaurant-assistant/
├── backend/ # FastAPI/Express + GraphQL + PostgreSQL
├── frontend/ # React (Next.js) dashboard
├── llm/ # Llama.cpp setup and integration
├── database/ # PostgreSQL setup and migrations
├── docker/ # Dockerfiles and docker-compose.yml
├── scripts/ # Automation scripts
├── README.md # Project documentation
├── .github/ # CI/CD Workflows

## Setup Instructions

### Prerequisites

-   Install **Docker & Docker Compose**
-   Install **Node.js** and **Python** (if running manually)

## Running the Project

docker-compose up --build

## Future Enhancements

-   Integrate **Twilio/Asterisk** for voice calls
-   Improve **LLM fine-tuning** for better voice interaction
-   Implement **CI/CD Pipelines** for automated deployments

## Contributing

1. Fork the repo & create a new branch (`feature-branch`)
2. Commit your changes and open a **Pull Request**.
