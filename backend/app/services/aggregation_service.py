def combine_cs_tcs(cs, tcs):
    return round(0.6 * cs + 0.4 * int(tcs["score"]), 1)
