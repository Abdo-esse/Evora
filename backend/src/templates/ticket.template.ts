import PDFDocument from 'pdfkit';

export interface TicketTemplateData {
    reservationId: string;
    userFullName: string;
    email: string;
    eventTitle: string;
    eventDate: Date;
    location: string;
    status: string;
}

export function ticketTemplate(
    doc: PDFKit.PDFDocument,
    data: TicketTemplateData,
) {
    // Titre
    doc.fontSize(22).text('🎟 EVENT TICKET', { align: 'center' });
    doc.moveDown();

    // Ligne
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Infos utilisateur
    doc.fontSize(12);
    doc.text(`Name: ${data.userFullName}`);
    doc.text(`Email: ${data.email}`);

    doc.moveDown();

    // Infos event
    doc.text(`Event: ${data.eventTitle}`);
    doc.text(`Date: ${data.eventDate.toDateString()}`);
    doc.text(`Location: ${data.location}`);

    doc.moveDown();

    // Infos réservation
    doc.text(`Reservation ID: ${data.reservationId}`);
    doc.text(`Status: ${data.status}`);

    doc.moveDown(2);
    doc.text('Please present this ticket at the entrance.', {
        align: 'center',
    });

    // Footer
    doc.moveDown(4);
    doc.fontSize(10).text('© Your Company - All rights reserved', {
        align: 'center',
    });
}
