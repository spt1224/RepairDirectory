<?php

namespace TheRestartProject\RepairDirectory\Application\Validators;

use TheRestartProject\RepairDirectory\Application\Exceptions\ValidationException;

/**
 * Interface Validator
 *
 * Simply enforces that a validate method exists on all implementing classes.
 *
 * @category Validator
 * @package  TheRestartProject\RepairDirectory\Application\Validators
 * @author   Joaquim d'Souza <joaquim@outlandish.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     http://www.outlandish.com/
 */
interface Validator
{
    /**
     * Should throw a ValidationException or return void.
     *
     * @param mixed $value The value to test
     *
     * @throws ValidationException
     *
     * @return void
     */
    function validate($value);
}
