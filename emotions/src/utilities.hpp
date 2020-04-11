/**
 * \file utilities.hpp
 * \brief An header containing various useful functions.
 *
 * This header contains various and miscellaneous functions useful in other sections of the source code.
 *
 * \author Andrea Esposito
 * \date April 8, 2020
 */

#ifndef EMOTIONS_UTILITIES_HPP
#define EMOTIONS_UTILITIES_HPP

#include "exit_codes.hpp"

/**
 * @brief Set up the tool's options and arguments.
 *
 * This function is responsible of the  \ref index "CLI API" of the tool. It sets and handles the available options and arguments.
 *
 * @param argc The length of `argv`.
 * @param argv The array of arguments passed via CLI.
 * @param images A variable that will contain the images passed through the CLI API.
 * @return An \ref exit_codes "exit code":
 *   - exit_codes::OK If the given arguments are valid and no errors occurred.
 *   - exit_codes::HALT If the given arguments are valid but the argument combination stops the execution.
 *   - exit_codes::ARGUMENT_ERROR If the given arguments are invalid
 *   - exit_codes::UNKNOWN_ARGUMENT_ERROR If an unknown error occurred.
 */
exit_codes setup_options(int argc, char **argv, std::vector<std::string> &images);

#endif //EMOTIONS_UTILITIES_HPP
