<?php

namespace App\Providers;

use Illuminate\Cookie\CookieJar;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use League\Tactician\CommandBus;
use TheRestartProject\RepairDirectory\Application\Auth\FixometerSessionGuard;
use TheRestartProject\RepairDirectory\Application\Auth\FixometerSessionService;
use TheRestartProject\Fixometer\Domain\Repositories\FixometerSessionRepository;
use TheRestartProject\Fixometer\Domain\Repositories\UserRepository;
use TheRestartProject\Fixometer\Infrastructure\Doctrine\Repositories\DoctrineFixometerSessionRepository;
use TheRestartProject\Fixometer\Infrastructure\Doctrine\Repositories\DoctrineUserRepository;
use TheRestartProject\RepairDirectory\Application\Auth\Policies\BusinessPolicy;
use TheRestartProject\RepairDirectory\Domain\Models\Business;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        Business::class => BusinessPolicy::class
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // In the absence of user-definable permissions, this is a
        // basic (and temporary) gate to only give users defined in an env var
        // the 'accessAdmin' right.  The 'can' middleware is used in routes/web.php
        // on the admin routes to check for presence of the 'accessAdmin' right
        // for the current user.
        Gate::define('accessAdmin', function ($user) {
            $allowedUsersEmails = getenv('ALLOWED_USERS');
            $currentUserEmail = $user->getEmail();
            if ($allowedUsersEmails && $currentUserEmail) {
                $allowedUsersEmails = explode(',', $allowedUsersEmails);
                return in_array($currentUserEmail, $allowedUsersEmails);
            }
            return false;
        });

        Auth::extend('fixometer', function ($app, $name, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\Guard...

            return new FixometerSessionGuard(
                $name,
                Auth::createUserProvider($config['provider']),
                $app->make(FixometerSessionService::class)
            );
        });
    }


    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(UserRepository::class, DoctrineUserRepository::class);
        $this->app->singleton(FixometerSessionRepository::class, DoctrineFixometerSessionRepository::class);
        $this->app->singleton(FixometerSessionService::class, function ($app) {
            return new FixometerSessionService(
                'PHPSESSID',
                $app->make(CommandBus::class),
                $app->make(FixometerSessionRepository::class),
                $app->make(CookieJar::class)
            );
        });
    }
}
