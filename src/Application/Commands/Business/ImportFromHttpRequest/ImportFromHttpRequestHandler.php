<?php

namespace TheRestartProject\RepairDirectory\Application\Commands\Business\ImportFromHttpRequest;


use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Auth\Access\Gate;
use TheRestartProject\RepairDirectory\Application\Exceptions\BusinessValidationException;
use TheRestartProject\RepairDirectory\Application\Exceptions\EntityNotFoundException;
use TheRestartProject\RepairDirectory\Application\Util\StringUtil;
use TheRestartProject\RepairDirectory\Application\Validators\CustomBusinessValidator;
use TheRestartProject\RepairDirectory\Domain\Models\Business;
use TheRestartProject\RepairDirectory\Domain\Models\Point;
use TheRestartProject\RepairDirectory\Domain\Repositories\BusinessRepository;
use TheRestartProject\RepairDirectory\Domain\Services\Geocoder;

/**
 * Handles the ImportFromCsvRowCommand to import a Business
 *
 * @category CommandHandler
 * @package  TheRestartProject\RepairDirectory\Application\Commands\Business\ImportFromHttpRequest
 * @author   Joaquim d'Souza <joaquim@outlandish.com>
 * @license  GPLv2 https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html
 * @link     http://tactician.thephpleague.com/
 */
class ImportFromHttpRequestHandler
{
    /**
     * An implementation of the BusinessRepository
     *
     * @var BusinessRepository
     */
    private $repository;

    /**
     * The geocoder to get [lat, lng] of business
     *
     * @var Geocoder
     */
    private $geocoder;

    /**
     * Creates the handler for the ImportBusinessFromCsvRowCommand
     *
     * @param BusinessRepository $repository An implementation of the BusinessRepository
     * @param Geocoder           $geocoder   Geocoder to get [lat, lng] of business
     *
     * @return $this
     */
    public function __construct(BusinessRepository $repository, Geocoder $geocoder)
    {
        $this->repository = $repository;
        $this->geocoder = $geocoder;
    }

    /**
     * Handles the Command by importing a Business from a CSV row
     *
     * @param ImportFromHttpRequestCommand $command The command to handle
     *
     * @return Business
     *
     * @throws EntityNotFoundException
     * @throws BusinessValidationException
     * @throws AuthorizationException
     */
    public function handle(ImportFromHttpRequestCommand $command)
    {
        $data = $command->getData();

        $businessUid = $command->getBusinessUid();

        $business = new Business();
        $isCreate = true;

        if ($businessUid !== null) {
            $business = $this->repository->findById($businessUid);
        }

        if (!$business) {
            throw new EntityNotFoundException("Business with id of {$businessUid} could not be found");
        }

        $this->updateValues($business, $data);

        $business->setUpdatedBy(auth()->user()->getAuthIdentifier());
        $business->setUpdatedAt(new \DateTime("now"));

        $business->setGeolocation($this->createPoint($data));

        if (is_null($business->getCreatedBy())) {
            $business->setCreatedBy(auth()->user()->getAuthIdentifier());
        }

        if ($isCreate) {
            $this->repository->add($business);
        }

        return $business;
    }

    /**
     * Update the $business fields from a $data array
     *
     * @param Business $business The business to update
     * @param array    $data     An [ $key => $value ] array of fields to update
     *
     * @return void
     */
    private function updateValues($business, $data)
    {
        foreach ($data as $key => $value) {
            $setter = 'set' . ucfirst($key);
            if (method_exists($business, $setter)) {
                $business->{$setter}($value);
            }
        }
    }

    /**
     * Creates a Point from the geolocation data
     *
     * @param array $data The array of data
     *
     * @return Point
     *
     * @SuppressWarnings(PHPMD.StaticAccess)
     */
    protected function createPoint($data)
    {
        return Point::fromArray($data['geolocation']);
    }
}
