// js/state.js
import { K, loadArray } from "./storage.js";

export const SERVICE_CATALOG = {
  "HOUSE REPAIR": [
    "Electrician","Plumber","Carpenter","Painter","Mason","Tile Installer",
    "Roof Repair Specialist","Door & Window Repair","Furniture Repair","Handyman (General Repairs)"
  ],
  "CARE TAKING": [
    "Babysitter","Nanny","Elderly Caregiver","Private Nurse","Home Health Aide",
    "Special Needs Caregiver","Post-Surgery Care Assistant","Companion Care","Child Tutor / Homework Helper"
  ],
  "MAINTENANCE": [
    "House Cleaner","Deep Cleaning Specialist","Office Cleaner","Laundry Service","Pool Cleaner",
    "Pest Control Technician","Gardener / Landscaper","Janitorial Service","Building Maintenance Staff"
  ],
  "BEAUTY CARE": [
    "Hair Stylist","Barber","Makeup Artist","Nail Technician","Lash & Brow Technician",
    "Esthetician / Facial Specialist","Massage Therapist","Bridal Beauty Specialist","Mobile Beauty Professional"
  ],
  "AUTOMOTIVE": [
    "Auto Mechanic","Motorcycle Mechanic","Car Electrician","Tire Repair Specialist","Car Detailer",
    "Auto Aircon Technician","Roadside Assistance","Vehicle Inspector","Car Wash Specialist"
  ]
};

export const state = {
  providers: loadArray(K.providers),
  clients: loadArray(K.clients),
  bookings: loadArray(K.bookings),
  reviews: loadArray(K.reviews),
  blocks: loadArray(K.blocks),
  reports: loadArray(K.reports),
  availability: loadArray(K.availability),
  chats: loadArray(K.chats),
  verifyRequests: loadArray(K.verifyRequests),

  // ✅ NEW
  notifications: loadArray(K.notifications),

  providerSelectedServices: [],
  bookingDraft: { providerId: null },
  reportTargetProviderId: null
};
