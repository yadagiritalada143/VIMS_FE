import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderByPipe } from './pipe/order-by.pipe';
import { SvmsTableComponent } from './svms-table.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SvmsTableComponent', () => {
  let component: SvmsTableComponent;
  let fixture: ComponentFixture<SvmsTableComponent>;
  CommonTestingModule.setUpTestBed(SvmsTableComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvmsTableComponent, OrderByPipe ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
