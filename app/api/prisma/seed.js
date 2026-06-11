"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    await prisma.activity.deleteMany();
    const activities = [
        { title: 'Board game night', category: 'indoor', tags: ['games', 'competitive', 'fun'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Movie marathon', category: 'indoor', tags: ['chill', 'movies', 'relax'], minPlayers: 1, maxPlayers: 10 },
        { title: 'Cook a new recipe together', category: 'indoor', tags: ['cooking', 'creative', 'food'], minPlayers: 2, maxPlayers: 6 },
        { title: 'Video game tournament', category: 'indoor', tags: ['games', 'competitive', 'fun'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Karaoke at home', category: 'indoor', tags: ['music', 'fun', 'silly'], minPlayers: 2, maxPlayers: 10 },
        { title: 'Escape room', category: 'indoor', tags: ['puzzles', 'competitive', 'adventure'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Paint and sip', category: 'indoor', tags: ['creative', 'art', 'chill'], minPlayers: 2, maxPlayers: 10 },
        { title: 'Picnic in the park', category: 'outdoor', tags: ['chill', 'nature', 'food'], minPlayers: 2, maxPlayers: 15 },
        { title: 'Bike ride', category: 'outdoor', tags: ['sport', 'nature', 'active'], minPlayers: 2, maxPlayers: 10 },
        { title: 'Street food tour', category: 'outdoor', tags: ['food', 'adventure', 'walking'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Photography walk', category: 'outdoor', tags: ['creative', 'walking', 'chill'], minPlayers: 1, maxPlayers: 6 },
        { title: 'Rooftop hangout', category: 'outdoor', tags: ['chill', 'views', 'social'], minPlayers: 2, maxPlayers: 12 },
        { title: 'Flea market exploration', category: 'outdoor', tags: ['shopping', 'adventure', 'walking'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Sunset hike', category: 'outdoor', tags: ['nature', 'active', 'views'], minPlayers: 2, maxPlayers: 10 },
        { title: 'Friendly football match', category: 'sport', tags: ['competitive', 'active', 'team'], minPlayers: 6, maxPlayers: 22 },
        { title: 'Badminton', category: 'sport', tags: ['competitive', 'active', 'fun'], minPlayers: 2, maxPlayers: 4 },
        { title: 'Bowling', category: 'sport', tags: ['fun', 'competitive', 'indoor'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Laser tag', category: 'sport', tags: ['competitive', 'fun', 'active'], minPlayers: 4, maxPlayers: 20 },
        { title: 'Padel', category: 'sport', tags: ['competitive', 'active', 'fun'], minPlayers: 4, maxPlayers: 4 },
        { title: 'Go-karting', category: 'sport', tags: ['competitive', 'fun', 'active'], minPlayers: 2, maxPlayers: 12 },
        { title: 'Ping pong battle', category: 'sport', tags: ['competitive', 'active', 'fun'], minPlayers: 2, maxPlayers: 4 },
        { title: 'Spa day', category: 'relaxation', tags: ['wellness', 'chill', 'self-care'], minPlayers: 1, maxPlayers: 6 },
        { title: 'Meditation session', category: 'relaxation', tags: ['wellness', 'chill', 'quiet'], minPlayers: 1, maxPlayers: 10 },
        { title: 'Netflix & chill', category: 'relaxation', tags: ['chill', 'movies', 'relax'], minPlayers: 1, maxPlayers: 6 },
        { title: 'Reading club', category: 'relaxation', tags: ['quiet', 'chill', 'intellectual'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Hammam & sauna', category: 'relaxation', tags: ['wellness', 'chill', 'self-care'], minPlayers: 1, maxPlayers: 8 },
        { title: 'Nap & brunch', category: 'relaxation', tags: ['chill', 'food', 'lazy'], minPlayers: 1, maxPlayers: 6 },
        { title: 'House party', category: 'party', tags: ['social', 'music', 'fun'], minPlayers: 5, maxPlayers: 30 },
        { title: 'Bar hopping', category: 'party', tags: ['social', 'drinks', 'fun'], minPlayers: 2, maxPlayers: 10 },
        { title: 'Club night', category: 'party', tags: ['music', 'dancing', 'social'], minPlayers: 2, maxPlayers: 12 },
        { title: 'Murder mystery dinner', category: 'party', tags: ['games', 'fun', 'social'], minPlayers: 4, maxPlayers: 12 },
        { title: 'Themed costume party', category: 'party', tags: ['creative', 'fun', 'social'], minPlayers: 5, maxPlayers: 30 },
        { title: 'Cocktail making class', category: 'party', tags: ['drinks', 'creative', 'social'], minPlayers: 2, maxPlayers: 12 },
        { title: 'Rooftop party', category: 'party', tags: ['social', 'music', 'views'], minPlayers: 4, maxPlayers: 20 },
        { title: 'Museum visit', category: 'culture', tags: ['intellectual', 'art', 'quiet'], minPlayers: 1, maxPlayers: 10 },
        { title: 'Concert or live show', category: 'culture', tags: ['music', 'social', 'fun'], minPlayers: 1, maxPlayers: 10 },
        { title: 'Theater or comedy show', category: 'culture', tags: ['fun', 'social', 'intellectual'], minPlayers: 1, maxPlayers: 8 },
        { title: 'Art gallery opening', category: 'culture', tags: ['art', 'social', 'intellectual'], minPlayers: 1, maxPlayers: 10 },
        { title: 'Historical city tour', category: 'culture', tags: ['walking', 'intellectual', 'adventure'], minPlayers: 2, maxPlayers: 12 },
        { title: 'Cinema outing', category: 'culture', tags: ['movies', 'chill', 'social'], minPlayers: 1, maxPlayers: 10 },
        { title: 'Book fair or market', category: 'culture', tags: ['intellectual', 'shopping', 'walking'], minPlayers: 1, maxPlayers: 8 },
        { title: 'Restaurant roulette', category: 'food', tags: ['food', 'social', 'adventure'], minPlayers: 2, maxPlayers: 10 },
        { title: 'Homemade sushi night', category: 'food', tags: ['cooking', 'food', 'fun'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Brunch spot hunt', category: 'food', tags: ['food', 'chill', 'social'], minPlayers: 2, maxPlayers: 8 },
        { title: 'BBQ in the park', category: 'food', tags: ['food', 'outdoor', 'social'], minPlayers: 3, maxPlayers: 15 },
        { title: 'Tasting menu dinner', category: 'food', tags: ['food', 'fancy', 'social'], minPlayers: 2, maxPlayers: 8 },
        { title: 'Baking challenge', category: 'food', tags: ['cooking', 'creative', 'fun'], minPlayers: 2, maxPlayers: 6 },
        { title: 'Food truck festival', category: 'food', tags: ['food', 'outdoor', 'social'], minPlayers: 2, maxPlayers: 12 },
    ];
    await prisma.activity.createMany({ data: activities });
    console.log(`Seeded ${activities.length} activities`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map