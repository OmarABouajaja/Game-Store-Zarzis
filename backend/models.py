
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True) # UUID stored as string
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    role = Column(String, default="worker") # 'owner' or 'worker'
    created_at = Column(DateTime, default=datetime.utcnow)
    
class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    name_fr = Column(String)
    description = Column(String, nullable=True)
    price = Column(Float)
    stock_quantity = Column(Integer, default=0)
    category = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
class Sale(Base):
    __tablename__ = "sales"

    id = Column(String, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer)
    total_amount = Column(Float)
    payment_method = Column(String) # 'cash', 'points', 'mixed'
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")
