#!/usr/bin/env python
import setuptools
from distutils.core import setup

setup(name='firebase_to_xml',
      version='0.1',
      description='Python module for converting ACDD style metadata into the '
      + 'CIOOS ISO profile',
      url='https://github.com/cioos-siooc/metadata-xml',
      packages=setuptools.find_packages(),
      package_dir={
        'metadata_xml': 'modules/metadata-xml'
      },
      include_package_data=True,
      install_requires=[
          'google-auth',
          'google-oauth',
          'jinja2',
          'pathlib',
          'python-dotenv',
          'metadata-xml@ git+git://git@github.com/cioos-siooc/metadata-xml.git#egg=metadata-xml'
      ]
      )
