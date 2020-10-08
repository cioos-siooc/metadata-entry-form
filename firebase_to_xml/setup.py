#!/usr/bin/env python
import setuptools
from distutils.core import setup

setup(name='firebase_to_xml',
      version='0.1',
      description='Python module for converting ACDD style metadata into the '
      + 'CIOOS ISO profile',
      url='https://github.com/cioos-siooc/metadata-xml',
      packages=setuptools.find_packages(),
      include_package_data=True,
      install_requires=[
          'google-auth',
          'google-oauth',
          'Jinja2==2.10.3',
          'pathlib',
          'python-dotenv',
          'metadata_xml@git+git://github.com/cioos-siooc/metadata-xml.git'
      ]
      )
