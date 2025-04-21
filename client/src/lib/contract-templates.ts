import { ContractTemplate } from "@shared/schema";

// Default templates for contract creation
export const DEFAULT_NDA_CONTENT = `
# NON-DISCLOSURE AGREEMENT

## 1. PARTIES
This Non-Disclosure Agreement (the "Agreement") is entered into between [PARTY A] ("Disclosing Party") and [PARTY B] ("Receiving Party"), collectively referred to as the "Parties."

## 2. PURPOSE
The Parties wish to explore a potential business relationship. In connection with this opportunity, the Disclosing Party may share certain confidential and proprietary information with the Receiving Party.

## 3. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, in writing, orally or by inspection of tangible objects, which is designated as "Confidential," "Proprietary," or some similar designation, or that should reasonably be understood to be confidential given the nature of the information and the circumstances of disclosure.

## 4. OBLIGATIONS
The Receiving Party shall:
a) Maintain the confidentiality of the Confidential Information;
b) Not disclose any Confidential Information to any third party;
c) Use the Confidential Information only for the purpose of evaluating the potential business relationship;
d) Take reasonable measures to protect the secrecy of the Confidential Information.

## 5. TERM
This Agreement shall remain in effect for a period of [TERM] years from the Effective Date.

## 6. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

## 7. EFFECTIVE DATE
This Agreement is effective as of [EFFECTIVE DATE].

AGREED AND ACCEPTED:

[PARTY A]
By: _____________________
Name: 
Title: 
Date: 

[PARTY B]
By: _____________________
Name: 
Title: 
Date: 
`;

export const DEFAULT_SALES_AGREEMENT_CONTENT = `
# SALES AGREEMENT

## 1. PARTIES
This Sales Agreement (the "Agreement") is entered into between [SELLER] ("Seller") and [BUYER] ("Buyer"), collectively referred to as the "Parties."

## 2. GOODS/SERVICES
The Seller agrees to sell and the Buyer agrees to purchase the following goods/services:
[DESCRIPTION OF GOODS/SERVICES]

## 3. PRICE AND PAYMENT
The price for the goods/services shall be [PRICE] plus applicable taxes. Payment shall be made as follows:
[PAYMENT TERMS]

## 4. DELIVERY
Seller shall deliver the goods/services to Buyer on or before [DELIVERY DATE] at [DELIVERY LOCATION].

## 5. WARRANTIES
Seller warrants that the goods/services shall be free from defects in material and workmanship for a period of [WARRANTY PERIOD] from the date of delivery.

## 6. LIMITATION OF LIABILITY
Seller's liability shall not exceed the purchase price of the goods/services.

## 7. TERM AND TERMINATION
This Agreement shall commence on the Effective Date and continue until the obligations of both parties have been fulfilled, unless terminated earlier in accordance with this Agreement.

## 8. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

## 9. EFFECTIVE DATE
This Agreement is effective as of [EFFECTIVE DATE].

AGREED AND ACCEPTED:

[SELLER]
By: _____________________
Name: 
Title: 
Date: 

[BUYER]
By: _____________________
Name: 
Title: 
Date: 
`;

export const DEFAULT_PURCHASE_ORDER_CONTENT = `
# PURCHASE ORDER

## PURCHASE ORDER NO: [PO NUMBER]
## DATE: [DATE]

## BUYER:
[BUYER NAME]
[BUYER ADDRESS]
[BUYER CONTACT INFO]

## SUPPLIER:
[SUPPLIER NAME]
[SUPPLIER ADDRESS]
[SUPPLIER CONTACT INFO]

## DELIVERY INFORMATION:
Delivery Date: [DELIVERY DATE]
Delivery Address: [DELIVERY ADDRESS]
Shipping Method: [SHIPPING METHOD]

## PAYMENT TERMS:
[PAYMENT TERMS]

## ITEMS:

| Item No. | Description | Quantity | Unit Price | Total |
|----------|-------------|----------|------------|-------|
| 1        | [ITEM 1]    | [QTY 1]  | [PRICE 1]  | [TOTAL 1] |
| 2        | [ITEM 2]    | [QTY 2]  | [PRICE 2]  | [TOTAL 2] |
| 3        | [ITEM 3]    | [QTY 3]  | [PRICE 3]  | [TOTAL 3] |

Subtotal: [SUBTOTAL]
Tax: [TAX]
Shipping: [SHIPPING]
**TOTAL**: [GRAND TOTAL]

## SPECIAL INSTRUCTIONS:
[SPECIAL INSTRUCTIONS]

## AUTHORIZATION:

Authorized by: _____________________
Name: 
Title: 
Date: 

## ACCEPTANCE:
By accepting this Purchase Order, the Supplier agrees to the terms and conditions stated herein.

Accepted by: _____________________
Name: 
Title: 
Date: 
`;

// Get default content for a template
export function getDefaultContentForTemplate(templateName: string): string {
  switch (templateName) {
    case "NDA":
      return DEFAULT_NDA_CONTENT;
    case "Sales Agreement":
      return DEFAULT_SALES_AGREEMENT_CONTENT;
    case "Purchase Order":
      return DEFAULT_PURCHASE_ORDER_CONTENT;
    default:
      return "";
  }
}

// Get a placeholder value for template fields
export function getPlaceholderText(templateName: string): Record<string, string> {
  const baseFields = {
    "JURISDICTION": "State of California, United States",
    "EFFECTIVE DATE": new Date().toLocaleDateString(),
    "TERM": "3"
  };

  switch (templateName) {
    case "NDA":
      return {
        ...baseFields,
        "PARTY A": "Your Company Name",
        "PARTY B": "Their Company Name"
      };
    case "Sales Agreement":
      return {
        ...baseFields,
        "SELLER": "Your Company Name",
        "BUYER": "Their Company Name",
        "DESCRIPTION OF GOODS/SERVICES": "Detailed description of goods or services being provided",
        "PRICE": "$ Amount",
        "PAYMENT TERMS": "e.g., 50% upfront, 50% upon delivery",
        "DELIVERY DATE": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        "DELIVERY LOCATION": "Address",
        "WARRANTY PERIOD": "12 months"
      };
    case "Purchase Order":
      return {
        ...baseFields,
        "PO NUMBER": `PO-${Date.now().toString().slice(-6)}`,
        "DATE": new Date().toLocaleDateString(),
        "BUYER NAME": "Your Company Name",
        "BUYER ADDRESS": "Your Address",
        "BUYER CONTACT INFO": "Your Email / Phone",
        "SUPPLIER NAME": "Supplier Company Name",
        "SUPPLIER ADDRESS": "Supplier Address",
        "SUPPLIER CONTACT INFO": "Supplier Email / Phone",
        "DELIVERY DATE": new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        "DELIVERY ADDRESS": "Delivery Address",
        "SHIPPING METHOD": "Standard Shipping",
        "PAYMENT TERMS": "Net 30",
        "ITEM 1": "Product/Service 1",
        "QTY 1": "1",
        "PRICE 1": "$100.00",
        "TOTAL 1": "$100.00",
        "ITEM 2": "Product/Service 2",
        "QTY 2": "2",
        "PRICE 2": "$50.00",
        "TOTAL 2": "$100.00",
        "ITEM 3": "Product/Service 3",
        "QTY 3": "3",
        "PRICE 3": "$25.00",
        "TOTAL 3": "$75.00",
        "SUBTOTAL": "$275.00",
        "TAX": "$22.00",
        "SHIPPING": "$15.00",
        "GRAND TOTAL": "$312.00",
        "SPECIAL INSTRUCTIONS": "Any special delivery or handling instructions"
      };
    default:
      return baseFields;
  }
}

// Fill in template placeholders with values
export function fillTemplateWithValues(
  content: string, 
  values: Record<string, string>
): string {
  let filledContent = content;
  
  Object.entries(values).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    filledContent = filledContent.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return filledContent;
}
