#!/usr/bin/env python

# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is mozilla.org code.
#
# The Initial Developer of the Original Code is
# Mozilla.org.
# Portions created by the Initial Developer are Copyright (C) 2010
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#     Jeff Hammel <jhammel@mozilla.com>     (Original author)
#     Siddharth Agarwal <sid.bugzilla@gmail.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either of the GNU General Public License Version 2 or later (the "GPL"),
# or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

"""
install mozmill and its dependencies
"""

import os
import sys
from subprocess import call

### utility functions for cross-platform

def is_windows():
  return sys.platform.startswith('win')

def esc(path):
  """quote and escape a path for cross-platform use"""
  return '"%s"' % repr(path)[1:-1]

def scripts_path(virtual_env):
  """path to scripts directory"""
  if is_windows():
    return os.path.join(virtual_env, 'Scripts')
  return os.path.join(virtual_env, 'bin')

def python_script_path(virtual_env, script_name):
  """path to a python script in a virtualenv"""
  scripts_dir = scripts_path(virtual_env)
  if is_windows():
    script_name = script_name + '-script.py'
  return os.path.join(scripts_dir, script_name)

def entry_point_path(virtual_env, entry_point):
  path = os.path.join(scripts_path(virtual_env), entry_point)
  if is_windows():
    path += '.exe'
  return path

### command-line entry point

def main(args=None):
  """command line front-end function"""

  # parse command line arguments
  args = args or sys.argv[1:]
  usage = "Usage: %prog [destination]"

  # Print the python version
  print 'Python: %s' % sys.version

  # The data is kept in the same directory as the script
  source=os.path.abspath(os.path.dirname(__file__))

  # directory to install to
  if not len(args):
    destination = source
  elif len(args) == 1:
    destination = os.path.abspath(args[0])
  else:
    print "Usage: %s [destination]" % sys.argv[0]
    sys.exit(1)

  os.chdir(source)

  # check for existence of necessary files
  if not os.path.exists('virtualenv'):
    print "File not found: virtualenv"
    sys.exit(1)

  # packages to install in dependency order
  packages = ["ManifestDestiny", "simplejson-2.1.6", "mozrunner", "jsbridge",
              "mozmill"]
  
  # create the virtualenv and install packages
  env = os.environ.copy()
  env.pop('PYTHONHOME', None)
  # The --no-site-packages is because of https://github.com/pypa/virtualenv/issues/165
  returncode = call([sys.executable, os.path.join('virtualenv', 'virtualenv.py'),
                     '--no-site-packages', destination], env=env)
  if returncode:
    print 'Failure to install virtualenv'
    sys.exit(returncode)
  pip = entry_point_path(destination, 'pip')
  returncode = call([pip, 'install'] + [os.path.abspath(package) for package in packages], env=env)
  if returncode:
    print 'Failure to install packages'
    sys.exit(returncode)

if __name__ == '__main__':
  main()
