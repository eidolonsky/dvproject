import sys
import json
from datetime import datetime
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import pandas as pd
import numpy as np
import pickle

if __name__ == '__main__':
    fname = sys.argv[1]
    with open(fname, 'r') as f:
        all_dates = []
        for line in f:
            tweet = json.loads(line)
            all_dates.append(tweet.get('created_at'))
        ones = np.ones(len(all_dates))
        idx = pd.DatetimeIndex(all_dates)
        my_series = pd.Series(ones, index=idx)
        per_minute = my_series.resample('1Min', how='sum').fillna(0)
        sys.stdout = open('t_time_series.jsonl','w')
        print(all_dates)