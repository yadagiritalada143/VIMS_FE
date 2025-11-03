import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddedValueComponent } from './added-value.component';

describe('AddedValueComponent', () => {
  let component: AddedValueComponent;
  let fixture: ComponentFixture<AddedValueComponent>;
  CommonTestingModule.setUpTestBed(AddedValueComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddedValueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddedValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
