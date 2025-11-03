import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SvmsTableRowComponent } from './svms-table-row.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { OrderByPipe } from '../pipe/order-by.pipe';

describe('SvmsTableRowComponent', () => {
  let component: SvmsTableRowComponent;
  let fixture: ComponentFixture<SvmsTableRowComponent>;
  CommonTestingModule.setUpTestBed(SvmsTableRowComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvmsTableRowComponent, OrderByPipe ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsTableRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
