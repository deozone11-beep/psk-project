package com.psk.builders.repository;

import com.psk.builders.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByCustomer_IdOrderByInvoiceDateDesc(Long customerId);
    List<Invoice> findAllByOrderByInvoiceDateDesc();
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
}
