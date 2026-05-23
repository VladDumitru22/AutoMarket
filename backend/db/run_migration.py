"""
Rulare: python db/run_migration.py
Adauga coloanele OfferStatus si CounterAmount in tabela Offers daca nu exista.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import engine

SQL = """
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Offers') AND name = 'OfferStatus'
)
BEGIN
    ALTER TABLE Offers ADD OfferStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending';
    PRINT 'Coloana OfferStatus adaugata.';
END
ELSE
    PRINT 'OfferStatus exista deja.';

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Offers') AND name = 'CounterAmount'
)
BEGIN
    ALTER TABLE Offers ADD CounterAmount DECIMAL(18, 2) NULL;
    PRINT 'Coloana CounterAmount adaugata.';
END
ELSE
    PRINT 'CounterAmount exista deja.';
"""

with engine.begin() as conn:
    conn.exec_driver_sql(SQL)
    print("Migrare finalizata cu succes.")
