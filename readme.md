## Restart Project Repairs Directory

### Setup

1. Create a Postgres database (and, optionally, a user for that database)
2. Copy .env.example to .env, and replace the values that are incorrect
3. Run `php artisan key:generate` to generate an `APP_KEY` env var (required for SSL)
4. Run `php artisan config:clear` to reload the config cache
5. Run `php artisan doctrine:migrations:migrate`
6. Seed the database with `php artisan restart:import:businesses data/test.csv`
7. Add the users to log in with to visit the admin section `php artisan db:seed --class=UserSeeder`.

The following users are created
| email | password | role |
| root@restartproject.com | secret | Root |
| admin@restartproject.com | secret | Administrator |
| host@restartproject.com | secret | Host |
| restarter@restartproject.com | secret | Restarter |
| guest@restartproject.com | secret | Guest |