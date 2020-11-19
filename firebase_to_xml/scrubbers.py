#!/usr/bin/env python3

'''
A few functions to remove empties in lists and dictionaries.
This is mostly to 'tidy up' the yaml that is output, makes it
much easier to read
'''


def scrub_dict(d_in):
    '''
    From:
    https://stackoverflow.com/questions/12118695/efficient-way-to-remove-keys-with-empty-strings-from-a-dict
    '''
    new_dict = {}
    for key, val in d_in.items():
        if isinstance(val, dict):
            val = scrub_dict(val)
        if isinstance(val, list):
            val = scrub_list(val)
        if val not in (u'', None, {}):
            new_dict[key] = val
    return new_dict


def scrub_list(d_in):
    'remove empty lists'
    scrubbed_list = []
    for i in d_in:
        if isinstance(i, dict):
            i = scrub_dict(i)
        scrubbed_list.append(i)
    return scrubbed_list


def scrub_keys(d_in):
    'remove empty lists that are properties of a dict'
    scrubbed = {}
    for k in d_in:
        if d_in[k]:
            scrubbed[k] = d_in[k]
    return scrubbed
