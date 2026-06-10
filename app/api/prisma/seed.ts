import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.activity.deleteMany()

  const activities = [
    // ── Indoor ────────────────────────────────────────────────
    { title: 'Board game night', category: 'indoor', tags: ['games', 'competitive', 'fun'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Movie marathon', category: 'indoor', tags: ['chill', 'movies', 'relax'], minPlayers: 1, maxPlayers: 10 },
    { title: 'Cook a new recipe together', category: 'indoor', tags: ['cooking', 'creative', 'food'], minPlayers: 2, maxPlayers: 6 },
    { title: 'Video game tournament', category: 'indoor', tags: ['games', 'competitive', 'fun'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Karaoke at home', category: 'indoor', tags: ['music', 'fun', 'silly'], minPlayers: 2, maxPlayers: 10 },
    { title: 'Escape room', category: 'indoor', tags: ['puzzles', 'competitive', 'adventure'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Paint and sip', category: 'indoor', tags: ['creative', 'art', 'chill'], minPlayers: 2, maxPlayers: 10 },

    // ── Outdoor ───────────────────────────────────────────────
    { title: 'Picnic in the park', category: 'outdoor', tags: ['chill', 'nature', 'food'], minPlayers: 2, maxPlayers: 15 },
    { title: 'Bike ride', category: 'outdoor', tags: ['sport', 'nature', 'active'], minPlayers: 2, maxPlayers: 10 },
    { title: 'Street food tour', category: 'outdoor', tags: ['food', 'adventure', 'walking'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Photography walk', category: 'outdoor', tags: ['creative', 'walking', 'chill'], minPlayers: 1, maxPlayers: 6 },
    { title: 'Rooftop hangout', category: 'outdoor', tags: ['chill', 'views', 'social'], minPlayers: 2, maxPlayers: 12 },
    { title: 'Flea market exploration', category: 'outdoor', tags: ['shopping', 'adventure', 'walking'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Sunset hike', category: 'outdoor', tags: ['nature', 'active', 'views'], minPlayers: 2, maxPlayers: 10 },

    // ── Sport ─────────────────────────────────────────────────
    { title: 'Friendly football match', category: 'sport', tags: ['competitive', 'active', 'team'], minPlayers: 6, maxPlayers: 22 },
    { title: 'Badminton', category: 'sport', tags: ['competitive', 'active', 'fun'], minPlayers: 2, maxPlayers: 4 },
    { title: 'Bowling', category: 'sport', tags: ['fun', 'competitive', 'indoor'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Laser tag', category: 'sport', tags: ['competitive', 'fun', 'active'], minPlayers: 4, maxPlayers: 20 },
    { title: 'Padel', category: 'sport', tags: ['competitive', 'active', 'fun'], minPlayers: 4, maxPlayers: 4 },
    { title: 'Go-karting', category: 'sport', tags: ['competitive', 'fun', 'active'], minPlayers: 2, maxPlayers: 12 },
    { title: 'Ping pong battle', category: 'sport', tags: ['competitive', 'active', 'fun'], minPlayers: 2, maxPlayers: 4 },

    // ── Relaxation ────────────────────────────────────────────
    { title: 'Spa day', category: 'relaxation', tags: ['wellness', 'chill', 'self-care'], minPlayers: 1, maxPlayers: 6 },
    { title: 'Meditation session', category: 'relaxation', tags: ['wellness', 'chill', 'quiet'], minPlayers: 1, maxPlayers: 10 },
    { title: 'Netflix & chill', category: 'relaxation', tags: ['chill', 'movies', 'relax'], minPlayers: 1, maxPlayers: 6 },
    { title: 'Reading club', category: 'relaxation', tags: ['quiet', 'chill', 'intellectual'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Hammam & sauna', category: 'relaxation', tags: ['wellness', 'chill', 'self-care'], minPlayers: 1, maxPlayers: 8 },
    { title: 'Nap & brunch', category: 'relaxation', tags: ['chill', 'food', 'lazy'], minPlayers: 1, maxPlayers: 6 },

    // ── Party ─────────────────────────────────────────────────
    { title: 'House party', category: 'party', tags: ['social', 'music', 'fun'], minPlayers: 5, maxPlayers: 30 },
    { title: 'Bar hopping', category: 'party', tags: ['social', 'drinks', 'fun'], minPlayers: 2, maxPlayers: 10 },
    { title: 'Club night', category: 'party', tags: ['music', 'dancing', 'social'], minPlayers: 2, maxPlayers: 12 },
    { title: 'Murder mystery dinner', category: 'party', tags: ['games', 'fun', 'social'], minPlayers: 4, maxPlayers: 12 },
    { title: 'Themed costume party', category: 'party', tags: ['creative', 'fun', 'social'], minPlayers: 5, maxPlayers: 30 },
    { title: 'Cocktail making class', category: 'party', tags: ['drinks', 'creative', 'social'], minPlayers: 2, maxPlayers: 12 },
    { title: 'Rooftop party', category: 'party', tags: ['social', 'music', 'views'], minPlayers: 4, maxPlayers: 20 },

    // ── Culture ───────────────────────────────────────────────
    { title: 'Museum visit', category: 'culture', tags: ['intellectual', 'art', 'quiet'], minPlayers: 1, maxPlayers: 10 },
    { title: 'Concert or live show', category: 'culture', tags: ['music', 'social', 'fun'], minPlayers: 1, maxPlayers: 10 },
    { title: 'Theater or comedy show', category: 'culture', tags: ['fun', 'social', 'intellectual'], minPlayers: 1, maxPlayers: 8 },
    { title: 'Art gallery opening', category: 'culture', tags: ['art', 'social', 'intellectual'], minPlayers: 1, maxPlayers: 10 },
    { title: 'Historical city tour', category: 'culture', tags: ['walking', 'intellectual', 'adventure'], minPlayers: 2, maxPlayers: 12 },
    { title: 'Cinema outing', category: 'culture', tags: ['movies', 'chill', 'social'], minPlayers: 1, maxPlayers: 10 },
    { title: 'Book fair or market', category: 'culture', tags: ['intellectual', 'shopping', 'walking'], minPlayers: 1, maxPlayers: 8 },

    // ── Food ──────────────────────────────────────────────────
    { title: 'Restaurant roulette', category: 'food', tags: ['food', 'social', 'adventure'], minPlayers: 2, maxPlayers: 10 },
    { title: 'Homemade sushi night', category: 'food', tags: ['cooking', 'food', 'fun'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Brunch spot hunt', category: 'food', tags: ['food', 'chill', 'social'], minPlayers: 2, maxPlayers: 8 },
    { title: 'BBQ in the park', category: 'food', tags: ['food', 'outdoor', 'social'], minPlayers: 3, maxPlayers: 15 },
    { title: 'Tasting menu dinner', category: 'food', tags: ['food', 'fancy', 'social'], minPlayers: 2, maxPlayers: 8 },
    { title: 'Baking challenge', category: 'food', tags: ['cooking', 'creative', 'fun'], minPlayers: 2, maxPlayers: 6 },
    { title: 'Food truck festival', category: 'food', tags: ['food', 'outdoor', 'social'], minPlayers: 2, maxPlayers: 12 },
  ]

  await prisma.activity.createMany({ data: activities })
  console.log(`Seeded ${activities.length} activities`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())