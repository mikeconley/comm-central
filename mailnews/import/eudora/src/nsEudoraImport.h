/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org Code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *     Jeff Beckley <beckley@qualcomm.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

#ifndef nsEudoraImport_h___
#define nsEudoraImport_h___

#include "nsIImportModule.h"
#include "nsCOMPtr.h"


#define NS_EUDORAIMPORT_CID          \
{ /* c8448da0-8f83-11d3-a206-00a0cc26da63 */      \
  0xc8448da0, 0x8f83, 0x11d3,            \
  {0xa2, 0x6, 0x0, 0xa0, 0xcc, 0x26, 0xda, 0x63 }}




#define kEudoraSupportsString NS_IMPORT_MAIL_STR "," NS_IMPORT_ADDRESS_STR "," NS_IMPORT_SETTINGS_STR "," NS_IMPORT_FILTERS_STR

class nsEudoraImport : public nsIImportModule
{
public:

  nsEudoraImport();
  virtual ~nsEudoraImport();

  NS_DECL_ISUPPORTS

  ////////////////////////////////////////////////////////////////////////////////////////
  // we suppport the nsIImportModule interface
  ////////////////////////////////////////////////////////////////////////////////////////

  NS_DECL_NSIIMPORTMODULE


protected:
};


#endif /* nsEudoraImport_h___ */
