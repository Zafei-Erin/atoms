import type { ReactNode } from "react";
import {
  AiIcon,
  ToolsIcon,
  SaasIcon,
  DashboardIcon,
  EcomIcon,
  GameIcon,
  LandingIcon,
  AppIcon,
} from "../../../icons";

export interface Idea {
  title: string;
  content: string;
}

export interface Category {
  label: string;
  icon: ReactNode;
  ideas: Idea[];
}

export const BUILD_CATEGORIES: Category[] = [
  {
    label: "AI Tool",
    icon: <AiIcon />,
    ideas: [
      {
        title: "AI Writing Assistant",
        content:
          "Build an AI writing assistant that helps users draft emails, blog posts, and reports with tone customization",
      },
      {
        title: "Resume Analyzer",
        content:
          "Create an AI-powered resume analyzer that gives candidates feedback and improvement suggestions",
      },
      {
        title: "Support Chatbot",
        content:
          "Build a chatbot that answers customer support questions using your company's knowledge base",
      },
    ],
  },
  {
    label: "Internal Tool",
    icon: <ToolsIcon />,
    ideas: [
      {
        title: "Onboarding Portal",
        content:
          "Build an employee onboarding portal where new hires complete tasks, sign documents, and meet the team",
      },
      {
        title: "Request Tracker",
        content:
          "Create an internal request management system for IT, HR, and ops teams to track and resolve tickets",
      },
      {
        title: "Resource Booking",
        content:
          "Build a team resource booking tool for reserving meeting rooms, equipment, and shared workspaces",
      },
    ],
  },
  {
    label: "SaaS",
    icon: <SaasIcon />,
    ideas: [
      {
        title: "Project Manager",
        content:
          "Build a subscription-based project management tool with kanban boards, deadlines, and team collaboration",
      },
      {
        title: "Freelancer Hub",
        content:
          "Create a SaaS platform for freelancers to manage clients, invoices, contracts, and project timelines",
      },
      {
        title: "Appointment Scheduler",
        content:
          "Build a multi-tenant SaaS app for small businesses to manage appointments and send reminders",
      },
    ],
  },
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    ideas: [
      {
        title: "Sales Dashboard",
        content:
          "Build a real-time sales dashboard that tracks revenue, conversion rates, and top-performing products",
      },
      {
        title: "Marketing Analytics",
        content:
          "Create a marketing analytics dashboard pulling data from Google Ads, Meta, and email campaigns",
      },
      {
        title: "Ops Monitor",
        content:
          "Build an operations dashboard that monitors inventory levels, order status, and fulfillment metrics",
      },
    ],
  },
  {
    label: "E-commerce",
    icon: <EcomIcon />,
    ideas: [
      {
        title: "Handmade Store",
        content:
          "Build an online store for handmade goods with product listings, cart, checkout, and order tracking",
      },
      {
        title: "Digital Downloads",
        content:
          "Create a digital downloads marketplace where creators sell templates, presets, and ebooks",
      },
      {
        title: "B2B Wholesale",
        content:
          "Build a B2B wholesale platform with bulk pricing, quote requests, and net payment terms",
      },
    ],
  },
  {
    label: "Game",
    icon: <GameIcon />,
    ideas: [
      {
        title: "Word Puzzle",
        content:
          "Build a browser-based word puzzle game with daily challenges and a global leaderboard",
      },
      {
        title: "Trivia Battle",
        content:
          "Create a multiplayer trivia game with custom quiz creation and real-time scoring",
      },
      {
        title: "Idle City",
        content:
          "Build a casual idle game where players grow a virtual city by collecting resources over time",
      },
    ],
  },
  {
    label: "Landing Page",
    icon: <LandingIcon />,
    ideas: [
      {
        title: "SaaS Launch Page",
        content:
          "Build a high-converting SaaS landing page with hero, features, pricing, testimonials, and waitlist signup",
      },
      {
        title: "Product Launch",
        content:
          "Create a product launch landing page with a countdown timer, feature highlights, and early-access form",
      },
      {
        title: "Portfolio Site",
        content:
          "Build a personal portfolio landing page showcasing work, skills, and a contact form",
      },
    ],
  },
  {
    label: "Personal Apps",
    icon: <AppIcon />,
    ideas: [
      {
        title: "Habit Tracker",
        content:
          "Build a personal habit tracker that lets me log daily routines and visualize streaks over time",
      },
      {
        title: "Reading List",
        content:
          "Create a reading list app where I can save books, track progress, and write private notes",
      },
      {
        title: "Expense Tracker",
        content:
          "Build a personal finance tracker to log expenses, set budgets, and see monthly spending breakdowns",
      },
    ],
  },
];
