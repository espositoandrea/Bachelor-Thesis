#  This file is part of 'analyzer', the tool used to process the information
#  collected for Andrea Esposito's Thesis.
#  Copyright (C) 2020  Andrea Esposito
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import re
from typing import List, Set

import numpy as np

from analyzer.data import Interaction
from analyzer.features.base import BasicStats, RateStats


def get_changed_features(first: Interaction, second: Interaction) -> Set[str]:
    return {k for k in first.to_dict() if first.to_dict()[k] != second.to_dict()[k] and not re.match(r'^emotions\..*?$',
                                                                                                     k) and k != '_id' and k != 'timestamp'}


def average_events_time(interactions: List[Interaction]) -> BasicStats:
    times = [obj.timestamp - interactions[i - 1].timestamp for i, obj in enumerate(interactions[1:], 1)]
    return BasicStats(sum(times), np.mean(times), np.std(times)) if times else BasicStats(0, 0, 0)


def average_idle_time(interactions: List[Interaction]) -> BasicStats:
    idle_times = []
    current_idle = 0
    for i, obj in enumerate(interactions[1:], 1):
        prev = interactions[i - 1]
        changed = get_changed_features(obj, prev)
        if not changed:
            current_idle += obj.timestamp - prev.timestamp
        else:
            idle_times.append(current_idle)
            current_idle = 0

    if current_idle != 0 or not idle_times:
        idle_times.append(current_idle)

    return BasicStats(sum(idle_times), np.mean(idle_times), np.std(idle_times))


def mouse_movements_per_milliseconds(interactions: List[Interaction], range_width: int) -> RateStats:
    count = 0
    current_position = interactions[0].mouse.position
    for obj in interactions[1:]:
        new_position = obj.mouse.position
        if new_position != current_position:
            count += 1
            current_position = new_position

    return RateStats(rate=count / range_width, total=count)


def scrolls_per_milliseconds(interactions: List[Interaction], range_width: int) -> RateStats:
    count = 0
    current_absolute = interactions[0].scroll.absolute
    current_relative = interactions[0].scroll.relative
    for obj in interactions[1:]:
        new_absolute = obj.scroll.absolute
        new_relative = obj.scroll.relative
        if new_absolute != current_absolute or new_relative != current_relative:
            count += 1
            current_absolute = new_absolute
            current_relative = new_relative

    return RateStats(rate=count / range_width, total=count)