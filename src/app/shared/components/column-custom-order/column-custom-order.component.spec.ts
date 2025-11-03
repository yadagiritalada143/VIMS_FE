import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColumnCustomOrderComponent } from './column-custom-order.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
describe('ColumnCustomOrderComponent', () => {
  let component: ColumnCustomOrderComponent;
  let fixture: ComponentFixture<ColumnCustomOrderComponent>;
  CommonTestingModule.setUpTestBed(ColumnCustomOrderComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ColumnCustomOrderComponent ]
    })
    .compileComponents();
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(ColumnCustomOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
